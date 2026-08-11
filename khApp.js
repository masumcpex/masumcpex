/* ==========================================================================
   khApp.js
   হাজিরা খাতার মূল লজিক — সদস্য ব্যবস্থাপনা, এন্ট্রি ফর্ম, সামারি,
   রেজিস্টার, CSV ডাউনলোড, মাসিক হিসাব মুছে ফেলা।
   Anonymous (no-login) এবং Email/Password (login) — দুই ভার্সনই এই একই
   ফাইল ব্যবহার করে, শুধু uid কে ভিন্নভাবে জোগাড় করে। তাই দুই জায়গায়
   একই ফিচার/বাগ-ফিক্স রাখতে আলাদা করে কিছু বদলাতে হয় না।
   ========================================================================== */

import {
  db, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot,
  query, where, serverTimestamp, writeBatch, runTransaction, getDoc
} from "./firebase.js";

const membersCol = collection(db, "kh_members");
const recordsCol = collection(db, "kh_records");

let appStarted = false;

export function initKhApp(uid){
  if(appStarted) return; // দুইবার চালু হওয়া ঠেকানো (auth state একাধিকবার ফায়ার করলেও)
  appStarted = true;

  let members = [];   // [{id, name}]
  let records = [];   // [{id, date, member, status, hours}]
  let membersLoaded = false;
  let recordsLoaded = false;

  const memberChips   = document.getElementById("memberChips");
  const noMemberNote  = document.getElementById("noMemberNote");
  const noMemberWarn  = document.getElementById("noMemberWarn");
  const memberInput   = document.getElementById("memberInput");
  const entryMember   = document.getElementById("entryMember");
  const filterMember  = document.getElementById("filterMember");
  const entryDate     = document.getElementById("entryDate");
  const entryHours    = document.getElementById("entryHours");
  const hoursField    = document.getElementById("hoursField");
  const entryForm     = document.getElementById("entryForm");
  const saveBtn       = entryForm.querySelector(".kh-save-btn");
  const addMemberBtn  = document.getElementById("addMemberBtn");
  const registerLoading = document.getElementById("registerLoading");
  const downloadCsvBtn  = document.getElementById("downloadCsvBtn");
  const downloadPdfBtn  = document.getElementById("downloadPdfBtn");
  const registerGroups  = document.getElementById("registerGroups");

  entryDate.value = new Date().toISOString().slice(0,10);

  /* ---------------- ছোট্ট ক্লিক-বাউন্স এফেক্ট ---------------- */
  function khBounce(el){
    if(!el) return;
    el.classList.remove("kh-bounce");
    void el.offsetWidth; // reflow যাতে animation আবার ট্রিগার হয়
    el.classList.add("kh-bounce");
    el.addEventListener("animationend", () => el.classList.remove("kh-bounce"), { once:true });
  }

  /* ---------------- ইউনিক Member ID তৈরি (যেমন: JAKIR-0001) ----------------
     প্রতিটা owner-এর নিজস্ব একটা কাউন্টার (kh_meta/{uid}) থাকে, Firestore
     transaction দিয়ে atomically বাড়ানো হয় — তাই একসাথে অনেকে সদস্য যোগ
     করলেও কখনো একই ID দুইজনকে বসবে না, ২৩৬+ ব্যবহারকারীর জন্যও নিরাপদ। */
  async function generateMemberId(name){
    const counterRef = doc(db, "kh_meta", uid);
    const seq = await runTransaction(db, async (tx) => {
      const snap = await tx.get(counterRef);
      const next = (snap.exists() ? (snap.data().memberCount || 0) : 0) + 1;
      tx.set(counterRef, { memberCount: next }, { merge: true });
      return next;
    });
    const prefix = (name || "USER").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12) || "USER";
    return `${prefix}-${String(seq).padStart(4, "0")}`;
  }

  /* এই মেম্বারের পাবলিক শেয়ার লিংক — যেখানেই সাইট হোস্ট হোক (masumcpex.com
     বা অন্য কোথাও), সবসময় বর্তমান পেজের ঠিকানা থেকে নিজে থেকেই তৈরি হয়। */
  function memberShareLink(memberId){
    return window.location.origin + window.location.pathname.replace(/worktrack\.html$/, "attendance-view.html") + "?id=" + encodeURIComponent(memberId);
  }

  async function copyMemberLink(memberId, btn){
    const link = memberShareLink(memberId);
    try{
      await navigator.clipboard.writeText(link);
    }catch(e){
      // ক্লিপবোর্ড API ব্লক হলে fallback
      const ta = document.createElement("textarea");
      ta.value = link; document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
    }
    const old = btn.textContent;
    btn.textContent = "✅";
    setTimeout(() => { btn.textContent = old; }, 1600);
  }

  /* ---------------- সদস্য রেন্ডার ---------------- */
  const CHIP_COLORS = ["chip-mint","chip-sky","chip-coral","chip-violet","chip-amber","chip-indigo","chip-rose","chip-teal"];
  const backfillingIds = new Set(); // একই মেম্বারের জন্য দুইবার backfill শুরু হওয়া ঠেকানো
  function renderMembers(){
    memberChips.innerHTML = members.map((m, i) => `
      <span class="member-chip ${CHIP_COLORS[i % CHIP_COLORS.length]}">
        ${m.name}
        <span class="kh-member-id">${m.memberId || "…"}</span>
        <button class="kh-view-link" data-id="${m.id}" data-memberid="${m.memberId || ''}" title="পাবলিক পেজ দেখুন">👁</button>
        <button class="kh-copy-link" data-id="${m.id}" data-memberid="${m.memberId || ''}" title="লিংক কপি করুন">🔗</button>
        <button class="kh-remove-member" data-id="${m.id}" title="বাদ দিন">✕</button>
      </span>`).join("");
    noMemberNote.style.display = members.length ? "none" : "block";
    noMemberWarn.style.display = members.length ? "none" : "block";
    saveBtn.disabled = !members.length;

    const currentEntryVal  = entryMember.value;
    const currentFilterVal = filterMember.value;

    const opts = members.map(m => `<option value="${m.name}">${m.name}</option>`).join("");
    entryMember.innerHTML = opts || `<option value="">— সদস্য নেই —</option>`;
    filterMember.innerHTML = `<option value="সবাই">সবাই</option>` + opts;

    if(members.some(m => m.name === currentEntryVal)) entryMember.value = currentEntryVal;
    if(currentFilterVal === "সবাই" || members.some(m => m.name === currentFilterVal)) filterMember.value = currentFilterVal;

    // পুরনো সদস্য (এই ফিচার আসার আগে যোগ করা) যাদের memberId নেই, তাদের জন্য
    // নিঃশব্দে একবার Member ID তৈরি করে দেওয়া হয় — কোনো ম্যানুয়াল কাজ লাগে না
    members.forEach(async m => {
      if(m.memberId || backfillingIds.has(m.id)) return;
      backfillingIds.add(m.id);
      try{
        const newId = await generateMemberId(m.name);
        await updateDoc(doc(db, "kh_members", m.id), { memberId: newId });
      }catch(err){
        console.error("memberId backfill failed for", m.name, err);
        backfillingIds.delete(m.id);
      }
    });
  }

  addMemberBtn.addEventListener("click", async () => {
    khBounce(addMemberBtn);
    const name = memberInput.value.trim();
    if(!name) return;
    if(members.some(m => m.name === name)){ memberInput.value = ""; return; }
    addMemberBtn.disabled = true;
    try{
      const memberId = await generateMemberId(name);
      await addDoc(membersCol, { name, memberId, ownerId: uid, createdAt: serverTimestamp() });
      memberInput.value = "";
    }catch(err){
      console.error(err);
      alert("সদস্য যোগ করতে সমস্যা হয়েছে। ইন্টারনেট সংযোগ চেক করে আবার চেষ্টা করুন।");
    }finally{
      addMemberBtn.disabled = false;
    }
  });
  memberInput.addEventListener("keydown", e => {
    if(e.key === "Enter"){ e.preventDefault(); addMemberBtn.click(); }
  });

  memberChips.addEventListener("click", async e => {
    const viewBtn = e.target.closest(".kh-view-link");
    if(viewBtn){
      if(!viewBtn.dataset.memberid){ alert("এই সদস্যের ID এখনো তৈরি হচ্ছে, একটু পর আবার চেষ্টা করুন।"); return; }
      window.open(memberShareLink(viewBtn.dataset.memberid), "_blank");
      return;
    }

    const copyBtn = e.target.closest(".kh-copy-link");
    if(copyBtn){
      if(!copyBtn.dataset.memberid){ alert("এই সদস্যের ID এখনো তৈরি হচ্ছে, একটু পর আবার চেষ্টা করুন।"); return; }
      await copyMemberLink(copyBtn.dataset.memberid, copyBtn);
      return;
    }

    const removeBtn = e.target.closest(".kh-remove-member");
    if(removeBtn){
      const m = members.find(x => x.id === removeBtn.dataset.id);
      if(!m) return;
      if(!confirm(`"${m.name}" কে সদস্য তালিকা থেকে বাদ দিতে চান? (পুরনো রেকর্ড মুছে যাবে না)`)) return;
      khBounce(removeBtn);
      try{
        await deleteDoc(doc(db, "kh_members", m.id));
      }catch(err){
        console.error(err);
        alert("সদস্য বাদ দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
      }
    }
  });

  /* ---------------- স্ট্যাটাস টগল (ছুটি হলে ঘণ্টা ইনপুট বন্ধ) ---------------- */
  entryForm.querySelectorAll('input[name="status"]').forEach(radio => {
    radio.addEventListener("change", () => {
      const isLeave = entryForm.querySelector('input[name="status"]:checked').value === "leave";
      entryHours.disabled = isLeave;
      hoursField.style.opacity = isLeave ? .5 : 1;
      if(isLeave) entryHours.value = "";
    });
  });

  /* ---------------- ডুপ্লিকেট এন্ট্রি সংক্রান্ত সাহায্যকারী ফাংশন ---------------- */
  function findExistingRecord(date, member){
    return records.find(r => r.date === date && r.member === member);
  }

  /* একই সদস্য+তারিখ নির্বাচন করলে আগের এন্ট্রি ফর্মে স্বয়ংক্রিয়ভাবে দেখানো (শুধু প্রিভিউ, এখনো সংরক্ষণ হয়নি) */
  function autoFillFromExisting(){
    const existing = findExistingRecord(entryDate.value, entryMember.value);
    if(!existing) return;
    const radio = entryForm.querySelector(`input[name="status"][value="${existing.status}"]`);
    if(radio){ radio.checked = true; }
    const isLeave = existing.status === "leave";
    entryHours.disabled = isLeave;
    hoursField.style.opacity = isLeave ? .5 : 1;
    entryHours.value = isLeave ? "" : existing.hours;
  }
  entryMember.addEventListener("change", autoFillFromExisting);
  entryDate.addEventListener("change", autoFillFromExisting);

  /* ---------------- সাধারণ নিশ্চিতকরণ মোডাল (মাস মুছে ফেলার জন্য ব্যবহৃত) ---------------- */
  function ensureConfirmModal(){
    let overlay = document.getElementById("khConfirmModalOverlay");
    if(overlay) return overlay;
    overlay = document.createElement("div");
    overlay.id = "khConfirmModalOverlay";
    overlay.className = "kh-modal-overlay";
    overlay.innerHTML = `
      <div class="kh-modal-card">
        <p class="kh-modal-icon" id="khConfirmIcon">⚠️</p>
        <p class="kh-modal-text" id="khConfirmText"></p>
        <div class="kh-modal-actions">
          <button type="button" class="btn3d btn-coral" id="khConfirmYesBtn">হ্যাঁ, নিশ্চিত</button>
          <button type="button" class="btn3d btn-mint" id="khConfirmNoBtn">বাতিল</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    return overlay;
  }
  function askConfirm(message, icon){
    return new Promise(resolve => {
      const overlay = ensureConfirmModal();
      overlay.querySelector("#khConfirmText").textContent = message;
      overlay.querySelector("#khConfirmIcon").textContent = icon || "⚠️";
      overlay.style.display = "flex";
      const yesBtn = overlay.querySelector("#khConfirmYesBtn");
      const noBtn  = overlay.querySelector("#khConfirmNoBtn");
      function cleanup(result){
        overlay.style.display = "none";
        yesBtn.removeEventListener("click", onYes);
        noBtn.removeEventListener("click", onNo);
        resolve(result);
      }
      function onYes(){ cleanup(true); }
      function onNo(){ cleanup(false); }
      yesBtn.addEventListener("click", onYes);
      noBtn.addEventListener("click", onNo);
    });
  }

  /* প্রিমিয়াম "ডুপ্লিকেট পাওয়া গেছে" মোডাল — থিমের সাথে মিলিয়ে, alert()-এর বদলে */
  function ensureDuplicateModal(){
    let overlay = document.getElementById("khDupModalOverlay");
    if(overlay) return overlay;
    overlay = document.createElement("div");
    overlay.id = "khDupModalOverlay";
    overlay.className = "kh-modal-overlay";
    overlay.innerHTML = `
      <div class="kh-modal-card">
        <p class="kh-modal-icon">⚠️</p>
        <p class="kh-modal-text">এই সদস্যের জন্য এই তারিখের হাজিরা ইতিমধ্যেই সংরক্ষিত আছে।</p>
        <div class="kh-modal-actions">
          <button type="button" class="btn3d btn-mint" id="khDupUpdateBtn">✏️ Update Record</button>
          <button type="button" class="btn3d btn-coral" id="khDupCancelBtn">❌ Cancel</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    return overlay;
  }
  function askDuplicateAction(){
    return new Promise(resolve => {
      const overlay = ensureDuplicateModal();
      overlay.style.display = "flex";
      const updateBtn = overlay.querySelector("#khDupUpdateBtn");
      const cancelBtn = overlay.querySelector("#khDupCancelBtn");
      function cleanup(result){
        overlay.style.display = "none";
        updateBtn.removeEventListener("click", onUpdate);
        cancelBtn.removeEventListener("click", onCancel);
        resolve(result);
      }
      function onUpdate(){ cleanup("update"); }
      function onCancel(){ cleanup("cancel"); }
      updateBtn.addEventListener("click", onUpdate);
      cancelBtn.addEventListener("click", onCancel);
    });
  }

  /* ---------------- এন্ট্রি সাবমিট ---------------- */
  entryForm.addEventListener("submit", async e => {
    e.preventDefault();
    if(!members.length) return;
    khBounce(saveBtn);
    const status = entryForm.querySelector('input[name="status"]:checked').value;
    const record = {
      date: entryDate.value,
      member: entryMember.value,
      status: status,
      hours: status === "duty" ? (parseFloat(entryHours.value) || 0) : 0,
      ownerId: uid,
      createdAt: serverTimestamp()
    };

    const existing = findExistingRecord(record.date, record.member);

    saveBtn.disabled = true;
    try{
      if(existing){
        const action = await askDuplicateAction();
        if(action === "cancel"){ return; }
        await updateDoc(doc(db, "kh_records", existing.id), {
          status: record.status,
          hours: record.hours,
          updatedAt: serverTimestamp()
        });
      }else{
        await addDoc(recordsCol, record);
      }
      entryHours.value = "";
    }catch(err){
      console.error(err);
      alert("রেকর্ড সংরক্ষণ করতে সমস্যা হয়েছে। ইন্টারনেট সংযোগ চেক করে আবার চেষ্টা করুন।");
    }finally{
      saveBtn.disabled = !members.length;
    }
  });

  /* ---------------- সামারি টেবিল ---------------- */
  function renderSummary(){
    const tbody = document.querySelector("#summaryTable tbody");
    const noSummaryNote = document.getElementById("noSummaryNote");
    if(!records.length){
      tbody.innerHTML = "";
      noSummaryNote.style.display = "block";
      return;
    }
    noSummaryNote.style.display = "none";
    const byMember = {};
    records.forEach(r => {
      if(!byMember[r.member]) byMember[r.member] = { days:0, leaves:0, hours:0 };
      if(r.status === "duty"){ byMember[r.member].days++; byMember[r.member].hours += r.hours; }
      else{ byMember[r.member].leaves++; }
    });
    tbody.innerHTML = Object.keys(byMember).map(name => {
      const d = byMember[name];
      const m = members.find(x => x.name === name);
      const advanceVal = m && typeof m.advance === "number" ? m.advance : 0;
      const advanceCell = m
        ? `<div class="kh-advance-wrap">
             <span class="kh-advance-prefix">RM</span>
             <input type="number" class="kh-advance-input" data-id="${m.id}" value="${advanceVal}" step="0.01" min="0" placeholder="0">
           </div>`
        : `<span class="kh-advance-prefix">RM 0</span>`;
      return `<tr><td>${name}</td><td>${d.days}</td><td>${d.leaves}</td><td>${d.hours}</td><td>${advanceCell}</td></tr>`;
    }).join("");
  }

  /* সামারি টেবিলে অগ্রিম (advance) ইনপুট বদলালে kh_members ডকুমেন্টে সংরক্ষণ */
  document.querySelector("#summaryTable tbody").addEventListener("change", async e => {
    const input = e.target.closest(".kh-advance-input");
    if(!input) return;
    const val = parseFloat(input.value);
    const safeVal = isNaN(val) ? 0 : val;
    input.disabled = true;
    try{
      await updateDoc(doc(db, "kh_members", input.dataset.id), { advance: safeVal });
    }catch(err){
      console.error(err);
      alert("অগ্রিম সংরক্ষণ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    }finally{
      input.disabled = false;
    }
  });

  /* ---------------- বাংলা মাস/সংখ্যা হেল্পার ---------------- */
  const BN_MONTHS = ["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"];
  const BN_DIGITS = ["০","১","২","৩","৪","৫","৬","৭","৮","৯"];
  function toBn(n){ return String(n).split("").map(ch => /[0-9]/.test(ch) ? BN_DIGITS[ch] : ch).join(""); }
  function monthLabel(ym){ // "2026-08" -> "আগস্ট ২০২৬"
    const [y, m] = ym.split("-").map(Number);
    return `${BN_MONTHS[m-1]} ${toBn(y)}`;
  }

  /* ---------------- রেজিস্টার: মাস অনুযায়ী গ্রুপ করে collapsible সেকশনে দেখানো ---------------- */
  function renderRegister(){
    const noRecordsNote = document.getElementById("noRecordsNote");
    const filter = filterMember.value;
    const filtered = filter === "সবাই" ? records : records.filter(r => r.member === filter);

    if(!filtered.length){
      registerGroups.innerHTML = "";
      noRecordsNote.style.display = "block";
      return;
    }
    noRecordsNote.style.display = "none";

    const groups = {};
    filtered.forEach(r => {
      const ym = r.date.slice(0,7);
      (groups[ym] = groups[ym] || []).push(r);
    });
    const months = Object.keys(groups).sort((a,b) => b.localeCompare(a));

    registerGroups.innerHTML = months.map((ym, idx) => {
      const list = groups[ym].slice().sort((a,b) => b.date.localeCompare(a.date));
      const rows = list.map(r => `
        <tr>
          <td>${r.date}</td>
          <td>${r.member}</td>
          <td class="status-${r.status}">${r.status === "duty" ? "ডিউটি" : "ছুটি"}</td>
          <td>${r.status === "duty" ? r.hours : "—"}</td>
          <td><button class="row-delete" data-id="${r.id}" title="মুছুন">🗑️</button></td>
        </tr>`).join("");
      return `
        <details class="kh-month-group"${idx === 0 ? " open" : ""}>
          <summary class="kh-month-summary">
            <span class="kh-month-label">${monthLabel(ym)}</span>
            <span class="kh-month-count">${toBn(list.length)}টি এন্ট্রি</span>
            <button type="button" class="btn3d btn-danger kh-month-delete" data-ym="${ym}">🗑️ এই মাস মুছুন</button>
          </summary>
          <div class="table-wrap">
            <table class="kh-table">
              <thead><tr><th>তারিখ</th><th>নাম</th><th>স্ট্যাটাস</th><th>ঘণ্টা</th><th></th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </details>`;
    }).join("");
  }

  /* একটা নির্দিষ্ট মাস (ym = "YYYY-MM") এর সব রেকর্ড মুছে ফেলা — যেকোনো মাসের জন্যই কাজ করে, শুধু চলতি মাস না */
  async function deleteMonthRecords(ym, btn){
    const monthRecords = records.filter(r => r.date.startsWith(ym));
    if(!monthRecords.length) return;

    const ok = await askConfirm(
      `"${monthLabel(ym)}" মাসের মোট ${toBn(monthRecords.length)}টি এন্ট্রি স্থায়ীভাবে মুছে ফেলা হবে। এই কাজটি আর ফেরানো যাবে না।`,
      "🗑️"
    );
    if(!ok) return;

    if(btn) btn.disabled = true;
    try{
      // Firestore ব্যাচে একসাথে ৫০০টির বেশি অপারেশন করা যায় না, তাই ৪০০টি করে ভাগ করে ডিলিট করা হচ্ছে
      const chunkSize = 400;
      for(let i = 0; i < monthRecords.length; i += chunkSize){
        const batch = writeBatch(db);
        monthRecords.slice(i, i + chunkSize).forEach(r => batch.delete(doc(db, "kh_records", r.id)));
        await batch.commit();
      }
    }catch(err){
      console.error(err);
      alert("এই মাসের হিসাব মুছতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    }finally{
      if(btn) btn.disabled = false;
    }
  }

  /* একক এন্ট্রি ডিলিট + মাস ডিলিট — দুটোই এখন #registerGroups-এর ভেতরে থাকা বাটনে ক্লিক থেকে ধরা হয় */
  registerGroups.addEventListener("click", async e => {
    const rowDeleteBtn = e.target.closest(".row-delete");
    if(rowDeleteBtn){
      const ok = await askConfirm("এই এন্ট্রিটি মুছে ফেলতে চান?", "🗑️");
      if(!ok) return;
      khBounce(rowDeleteBtn);
      try{
        await deleteDoc(doc(db, "kh_records", rowDeleteBtn.dataset.id));
      }catch(err){
        console.error(err);
        alert("এন্ট্রি মুছতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
      }
      return;
    }

    const monthDeleteBtn = e.target.closest(".kh-month-delete");
    if(monthDeleteBtn){
      // <summary>-এর ভেতরের বাটন হওয়ায় ক্লিক করলে <details> টা খুলে/বন্ধ না হয়ে যায় সেটা আটকানো
      e.preventDefault();
      e.stopPropagation();
      khBounce(monthDeleteBtn);
      await deleteMonthRecords(monthDeleteBtn.dataset.ym, monthDeleteBtn);
    }
  });

  filterMember.addEventListener("change", renderRegister);

  /* ---------------- এই মাসের রিপোর্ট ডাউনলোড (CSV) ---------------- */
  function currentYearMonth(){
    return new Date().toISOString().slice(0,7); // "YYYY-MM"
  }

  downloadCsvBtn.addEventListener("click", () => {
    khBounce(downloadCsvBtn);
    const ym = currentYearMonth();
    const filter = filterMember.value;
    const monthRecords = records
      .filter(r => r.date.startsWith(ym))
      .filter(r => filter === "সবাই" || r.member === filter)
      .slice().sort((a,b) => a.date.localeCompare(b.date));

    if(!monthRecords.length){
      alert("এই মাসে এখনো কোনো রেকর্ড নেই।");
      return;
    }

    const header = ["তারিখ","নাম","স্ট্যাটাস","ঘণ্টা"];
    const rows = monthRecords.map(r => [
      r.date,
      r.member,
      r.status === "duty" ? "ডিউটি" : "ছুটি",
      r.status === "duty" ? r.hours : ""
    ]);
    const csvContent = [header, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(","))
      .join("\r\n");

    // এক্সেল/বাংলা টেক্সট ঠিকভাবে দেখানোর জন্য BOM যোগ করা হলো
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hajira-report-${ym}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  /* ---------------- এই মাসের রিপোর্ট ডাউনলোড (PDF) ----------------
     সম্পূর্ণ ক্লায়েন্ট-সাইড (ব্রাউজারেই) তৈরি হয় — Firebase Storage-এ
     কোনো ফাইল আপলোড/সংরক্ষণ করা হয় না। CSV-এর মতোই একই local `records`
     ভ্যারিয়েবল থেকে ডেটা নেওয়া হয়, শুধু আউটপুট ফরম্যাট আলাদা।
     বাংলা টেক্সট সঠিকভাবে দেখানোর জন্য html2canvas দিয়ে একটা HTML
     টেমপ্লেট ছবিতে রূপান্তর করে সেই ছবি jsPDF দিয়ে PDF-এ বসানো হয়
     (এতে ব্রাউজারের নিজস্ব বাংলা ফন্ট রেন্ডারিং হুবহু বজায় থাকে)। */
  downloadPdfBtn.addEventListener("click", async () => {
    if(typeof window.html2canvas === "undefined" || typeof window.jspdf === "undefined"){
      alert("PDF তৈরির লাইব্রেরি লোড হয়নি। ইন্টারনেট সংযোগ চেক করে আবার চেষ্টা করুন।");
      return;
    }

    khBounce(downloadPdfBtn);
    const ym = currentYearMonth();
    const filter = filterMember.value;
    const monthRecords = records
      .filter(r => r.date.startsWith(ym))
      .filter(r => filter === "সবাই" || r.member === filter)
      .slice().sort((a,b) => a.date.localeCompare(b.date));

    if(!monthRecords.length){
      alert("এই মাসে এখনো কোনো রেকর্ড নেই।");
      return;
    }

    downloadPdfBtn.disabled = true;
    const originalLabel = downloadPdfBtn.textContent;
    downloadPdfBtn.textContent = "⏳ PDF তৈরি হচ্ছে...";

    try{
      await generatePdfReport(ym, monthRecords);
    }catch(err){
      console.error(err);
      alert("PDF তৈরি করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    }finally{
      downloadPdfBtn.disabled = false;
      downloadPdfBtn.textContent = originalLabel;
    }
  });

  async function generatePdfReport(ym, monthRecords){
    // প্রতিটা সদস্যের জন্য এই মাসের উপস্থিতি/অনুপস্থিতি/ঘণ্টা/শতাংশ হিসাব
    const byMember = {};
    monthRecords.forEach(r => {
      if(!byMember[r.member]) byMember[r.member] = { present:0, absent:0, hours:0 };
      if(r.status === "duty"){ byMember[r.member].present++; byMember[r.member].hours += (r.hours || 0); }
      else{ byMember[r.member].absent++; }
    });
    const memberNames = Object.keys(byMember).sort((a,b) => a.localeCompare(b, "bn"));

    const summaryRowsHtml = memberNames.map(name => {
      const d = byMember[name];
      const total = d.present + d.absent;
      const pct = total > 0 ? Math.round((d.present / total) * 100) : 0;
      return `
        <tr>
          <td class="pdf-td pdf-td-left">${escapeHtml(name)}</td>
          <td class="pdf-td pdf-td-center">${toBn(d.present)}</td>
          <td class="pdf-td pdf-td-center">${toBn(d.absent)}</td>
          <td class="pdf-td pdf-td-center">${toBn(d.hours)}</td>
          <td class="pdf-td pdf-td-center">${toBn(pct)}%</td>
        </tr>`;
    }).join("");

    const detailRowsHtml = monthRecords
      .slice().sort((a,b) => a.date.localeCompare(b.date))
      .map(r => `
        <tr>
          <td class="pdf-td pdf-td-left">${escapeHtml(r.date)}</td>
          <td class="pdf-td pdf-td-left">${escapeHtml(r.member)}</td>
          <td class="pdf-td pdf-td-left">${r.status === "duty" ? "ডিউটি" : "ছুটি"}</td>
          <td class="pdf-td pdf-td-center">${r.status === "duty" ? toBn(r.hours) : "—"}</td>
        </tr>`).join("");

    const totalPresent = memberNames.reduce((sum,n) => sum + byMember[n].present, 0);
    const totalAbsent  = memberNames.reduce((sum,n) => sum + byMember[n].absent, 0);
    const generatedAt = new Date().toLocaleString("bn-BD", { dateStyle:"medium", timeStyle:"short" });

    // ---------------- অফ-স্ক্রিন অফিসিয়াল প্রিন্ট টেমপ্লেট তৈরি ----------------
    const wrap = document.createElement("div");
    wrap.id = "pdfReportRoot";
    wrap.style.cssText = "position:fixed; left:-99999px; top:0; width:800px; background:#fff; padding:32px 30px; font-family:'Hind Siliguri','Noto Sans Bengali',sans-serif; color:#1B2A45; display:flex; flex-direction:column;";
    wrap.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:2px solid #0E6E5C; padding-bottom:16px; margin-bottom:24px;">
        <img src="masum-logo.webp" style="height:50px; object-fit:contain;" crossorigin="anonymous">
        <div style="text-align:right;">
          <div style="font-size:19px; font-weight:700; color:#0E6E5C; letter-spacing:.2px;">হাজিরা রিপোর্ট</div>
          <div style="font-size:13px; color:#666; margin-top:2px;">${monthLabel(ym)}</div>
        </div>
      </div>

      <table class="pdf-table" style="margin-bottom:26px;">
        <thead>
          <tr>
            <th class="pdf-th pdf-th-left">নাম</th>
            <th class="pdf-th">উপস্থিত</th>
            <th class="pdf-th">অনুপস্থিত</th>
            <th class="pdf-th">মোট ঘণ্টা</th>
            <th class="pdf-th">উপস্থিতির হার</th>
          </tr>
        </thead>
        <tbody>${summaryRowsHtml}</tbody>
        <tfoot>
          <tr class="pdf-tfoot-row">
            <td class="pdf-td pdf-td-left" style="font-weight:700;">সর্বমোট</td>
            <td class="pdf-td pdf-td-center" style="font-weight:700;">${toBn(totalPresent)}</td>
            <td class="pdf-td pdf-td-center" style="font-weight:700;">${toBn(totalAbsent)}</td>
            <td class="pdf-td" colspan="2"></td>
          </tr>
        </tfoot>
      </table>

      <div style="font-size:14px; font-weight:700; color:#0E6E5C; margin-bottom:10px;">দৈনিক বিবরণ</div>
      <table class="pdf-table" style="font-size:12px;">
        <thead>
          <tr>
            <th class="pdf-th pdf-th-left">তারিখ</th>
            <th class="pdf-th pdf-th-left">নাম</th>
            <th class="pdf-th pdf-th-left">স্ট্যাটাস</th>
            <th class="pdf-th">ঘণ্টা</th>
          </tr>
        </thead>
        <tbody>${detailRowsHtml}</tbody>
      </table>

      <div style="flex:1;"></div>

      <div style="margin-top:28px; padding-top:12px; border-top:1px solid #ccc; font-size:10.5px; color:#666; display:flex; justify-content:space-between; align-items:center;">
        <span>masumcpex.com&nbsp;&nbsp;|&nbsp;&nbsp;contact@masumcpex.com&nbsp;&nbsp;|&nbsp;&nbsp;+601133192963</span>
        <span>রিপোর্ট প্রস্তুত: ${escapeHtml(generatedAt)}</span>
      </div>
    `;

    // অফিসিয়াল ডকুমেন্ট লুক — সব সেল vertically centered, ধারাবাহিক প্যাডিং/বর্ডার
    const style = document.createElement("style");
    style.textContent = `
      #pdfReportRoot .pdf-table{ width:100%; border-collapse:collapse; font-size:13px; }
      #pdfReportRoot .pdf-th{
        background:#0E6E5C; color:#fff; padding:10px 8px; text-align:center;
        vertical-align:middle; font-weight:600; border:1px solid #0A5347;
      }
      #pdfReportRoot .pdf-th-left{ text-align:left; }
      #pdfReportRoot .pdf-td{
        padding:9px 8px; text-align:center; vertical-align:middle;
        border:1px solid #e2e2e2; line-height:1.4;
      }
      #pdfReportRoot .pdf-td-left{ text-align:left; }
      #pdfReportRoot .pdf-td-center{ text-align:center; }
      #pdfReportRoot .pdf-tfoot-row{ background:#F1F5F9; }
      #pdfReportRoot tr{ height:38px; }
    `;
    document.body.appendChild(style);
    document.body.appendChild(wrap);

    try{
      const canvas = await window.html2canvas(wrap, { scale:2, useCORS:true, backgroundColor:"#ffffff" });
      const { jsPDF } = window.jspdf;

      const A4_WIDTH_MM  = 210;
      const A4_HEIGHT_MM = 297;
      const imgWidthMM  = A4_WIDTH_MM;
      const imgHeightMM = (canvas.height * imgWidthMM) / canvas.width;
      const imgData = canvas.toDataURL("image/jpeg", 0.95);

      if(imgHeightMM <= A4_HEIGHT_MM){
        // কন্টেন্ট এক পেজেই ধরে যাচ্ছে — পেজের সাইজ কন্টেন্টের সমান করে বসানো হলো
        // যাতে নিচে অকারণে বড় ফাঁকা সাদা জায়গা না থাকে, ফুটার পেজের আসল নিচেই থাকে
        const pdf = new jsPDF({ orientation:"portrait", unit:"mm", format:[imgWidthMM, imgHeightMM] });
        pdf.addImage(imgData, "JPEG", 0, 0, imgWidthMM, imgHeightMM);
        pdf.save(`hajira-report-${ym}.pdf`);
      }else{
        // কন্টেন্ট এক A4 পেজের চেয়ে বড় — স্ট্যান্ডার্ড A4-এ একাধিক পেজে ভাগ করে বসানো
        const pdf = new jsPDF({ orientation:"portrait", unit:"mm", format:"a4" });
        let heightLeft = imgHeightMM;
        let position = 0;
        pdf.addImage(imgData, "JPEG", 0, position, imgWidthMM, imgHeightMM);
        heightLeft -= A4_HEIGHT_MM;
        while(heightLeft > 0){
          position = heightLeft - imgHeightMM;
          pdf.addPage();
          pdf.addImage(imgData, "JPEG", 0, position, imgWidthMM, imgHeightMM);
          heightLeft -= A4_HEIGHT_MM;
        }
        pdf.save(`hajira-report-${ym}.pdf`);
      }
      // সরাসরি ডিভাইসে ডাউনলোড — Firebase Storage-এ কিছু আপলোড হয় না
    }finally{
      document.body.removeChild(wrap);
      document.body.removeChild(style);
    }
  }

  function escapeHtml(str){
    return String(str)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&#039;");
  }


  /* ---------------- লোডিং ইন্ডিকেটর ---------------- */
  function updateLoadingState(){
    if(membersLoaded && recordsLoaded){
      registerLoading.style.display = "none";
    }
  }

  /* ---------------- প্রাথমিক রেন্ডার ---------------- */
  renderMembers();
  renderSummary();
  renderRegister();

  /* ---------------- এই uid-এর নিজের ডেটা শোনা শুরু ---------------- */
  const myMembersQuery = query(membersCol, where("ownerId", "==", uid));
  const myRecordsQuery = query(recordsCol, where("ownerId", "==", uid));

  onSnapshot(myMembersQuery, snapshot => {
    members = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a,b) => (a.name || "").localeCompare(b.name || "", "bn"));
    membersLoaded = true;
    renderMembers();
    renderSummary();
    renderRegister();
    updateLoadingState();
  }, err => {
    console.error(err);
    registerLoading.textContent = "ডেটা লোড করতে সমস্যা হয়েছে। ইন্টারনেট সংযোগ চেক করুন।";
  });

  onSnapshot(myRecordsQuery, snapshot => {
    records = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    recordsLoaded = true;
    renderSummary();
    renderRegister();
    updateLoadingState();
  }, err => {
    console.error(err);
    registerLoading.textContent = "ডেটা লোড করতে সমস্যা হয়েছে। ইন্টারনেট সংযোগ চেক করুন।";
  });
}
