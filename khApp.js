/* ==========================================================================
   khApp.js
   হাজিরা খাতার মূল লজিক — সদস্য ব্যবস্থাপনা, এন্ট্রি ফর্ম, সামারি,
   রেজিস্টার, CSV ডাউনলোড, মাসিক হিসাব মুছে ফেলা।
   Anonymous (no-login) এবং Email/Password (login) — দুই ভার্সনই এই একই
   ফাইল ব্যবহার করে, শুধু uid কে ভিন্নভাবে জোগাড় করে। তাই দুই জায়গায়
   একই ফিচার/বাগ-ফিক্স রাখতে আলাদা করে কিছু বদলাতে হয় না।
   ========================================================================== */

import {
  db, collection, addDoc, deleteDoc, doc, onSnapshot,
  query, where, serverTimestamp, writeBatch
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
  const deleteMonthBtn  = document.getElementById("deleteMonthBtn");

  entryDate.value = new Date().toISOString().slice(0,10);

  /* ---------------- ছোট্ট ক্লিক-বাউন্স এফেক্ট ---------------- */
  function khBounce(el){
    if(!el) return;
    el.classList.remove("kh-bounce");
    void el.offsetWidth; // reflow যাতে animation আবার ট্রিগার হয়
    el.classList.add("kh-bounce");
    el.addEventListener("animationend", () => el.classList.remove("kh-bounce"), { once:true });
  }

  /* ---------------- সদস্য রেন্ডার ---------------- */
  const CHIP_COLORS = ["chip-mint","chip-sky","chip-coral","chip-violet","chip-amber","chip-indigo","chip-rose","chip-teal"];
  function renderMembers(){
    memberChips.innerHTML = members.map((m, i) => `
      <span class="member-chip ${CHIP_COLORS[i % CHIP_COLORS.length]}">
        ${m.name}
        <button data-id="${m.id}" title="বাদ দিন">✕</button>
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
  }

  addMemberBtn.addEventListener("click", async () => {
    khBounce(addMemberBtn);
    const name = memberInput.value.trim();
    if(!name) return;
    if(members.some(m => m.name === name)){ memberInput.value = ""; return; }
    addMemberBtn.disabled = true;
    try{
      await addDoc(membersCol, { name, ownerId: uid, createdAt: serverTimestamp() });
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
    const btn = e.target.closest("button[data-id]");
    if(!btn) return;
    const m = members.find(x => x.id === btn.dataset.id);
    if(!m) return;
    if(!confirm(`"${m.name}" কে সদস্য তালিকা থেকে বাদ দিতে চান? (পুরনো রেকর্ড মুছে যাবে না)`)) return;
    khBounce(btn);
    try{
      await deleteDoc(doc(db, "kh_members", m.id));
    }catch(err){
      console.error(err);
      alert("সদস্য বাদ দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
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
    saveBtn.disabled = true;
    try{
      await addDoc(recordsCol, record);
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
      return `<tr><td>${name}</td><td>${d.days}</td><td>${d.leaves}</td><td>${d.hours}</td></tr>`;
    }).join("");
  }

  /* ---------------- রেজিস্টার টেবিল ---------------- */
  function renderRegister(){
    const tbody = document.querySelector("#registerTable tbody");
    const noRecordsNote = document.getElementById("noRecordsNote");
    const filter = filterMember.value;
    const list = (filter === "সবাই" ? records : records.filter(r => r.member === filter))
      .slice().sort((a,b) => b.date.localeCompare(a.date));

    if(!list.length){
      tbody.innerHTML = "";
      noRecordsNote.style.display = "block";
      return;
    }
    noRecordsNote.style.display = "none";
    tbody.innerHTML = list.map(r => `
      <tr>
        <td>${r.date}</td>
        <td>${r.member}</td>
        <td class="status-${r.status}">${r.status === "duty" ? "ডিউটি" : "ছুটি"}</td>
        <td>${r.status === "duty" ? r.hours : "—"}</td>
        <td><button class="row-delete" data-id="${r.id}" title="মুছুন">🗑️</button></td>
      </tr>`).join("");
  }

  document.querySelector("#registerTable tbody").addEventListener("click", async e => {
    const btn = e.target.closest(".row-delete");
    if(!btn) return;
    if(!confirm("এই এন্ট্রিটি মুছে ফেলতে চান?")) return;
    khBounce(btn);
    try{
      await deleteDoc(doc(db, "kh_records", btn.dataset.id));
    }catch(err){
      console.error(err);
      alert("এন্ট্রি মুছতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
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

  /* ---------------- এই মাসের হিসাব মুছে ফেলুন ---------------- */
  deleteMonthBtn.addEventListener("click", async () => {
    khBounce(deleteMonthBtn);
    const ym = currentYearMonth();
    const monthRecords = records.filter(r => r.date.startsWith(ym));

    if(!monthRecords.length){
      alert("এই মাসে মুছে ফেলার মতো কোনো রেকর্ড নেই।");
      return;
    }
    if(!confirm(`এই মাসের মোট ${monthRecords.length}টি এন্ট্রি স্থায়ীভাবে মুছে ফেলতে চান? এই কাজটি আর ফেরানো যাবে না।`)) return;

    deleteMonthBtn.disabled = true;
    try{
      // Firestore ব্যাচে একসাথে ৫০০টির বেশি অপারেশন করা যায় না, তাই ৪০০টি করে ভাগ করে ডিলিট করা হচ্ছে
      const chunkSize = 400;
      for(let i = 0; i < monthRecords.length; i += chunkSize){
        const batch = writeBatch(db);
        monthRecords.slice(i, i + chunkSize).forEach(r => {
          batch.delete(doc(db, "kh_records", r.id));
        });
        await batch.commit();
      }
    }catch(err){
      console.error(err);
      alert("এই মাসের হিসাব মুছতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    }finally{
      deleteMonthBtn.disabled = false;
    }
  });

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
