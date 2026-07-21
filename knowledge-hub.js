/* ==========================================================================
   knowledge-hub.js (Firestore ভার্সন — লগইন ছাড়া, সবার জন্য উন্মুক্ত)
   সব ডেটা Firebase Firestore-এ থাকে — তাই মোবাইল হারালে/বদলালেও ডেটা
   থাকবে, আর যেকোনো ডিভাইস থেকে দেখা/লেখা যাবে। কোনো লগইন/পাসওয়ার্ড নেই।
   ========================================================================== */

import { db, collection, addDoc, deleteDoc, doc, onSnapshot, query } from "./firebase.js";

const membersCol = collection(db, "kh_members");
const recordsCol = collection(db, "kh_records");

document.addEventListener("DOMContentLoaded", () => {

  let members = [];   // [{ id, name }]
  let records = [];   // [{ id, date, member, status, hours }]

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
  const addMemberBtn  = document.getElementById("addMemberBtn");
  const summaryMonth  = document.getElementById("summaryMonth");
  const exportMonthBtn = document.getElementById("exportMonthBtn");
  const closeMonthBtn  = document.getElementById("closeMonthBtn");
  const syncStatus    = document.getElementById("khSyncStatus");

  const todayStr = new Date().toISOString().slice(0, 10);
  entryDate.value = todayStr;
  summaryMonth.value = todayStr.slice(0, 7); // YYYY-MM

  /* ---------------- লোডিং অবস্থা ---------------- */
  memberChips.innerHTML = `<span style="color:#7A6F5D; font-size:.9rem;">⏳ লোড হচ্ছে...</span>`;

  /* ---------------- সদস্য রেন্ডার ---------------- */
  const CHIP_COLORS = ["chip-mint","chip-sky","chip-coral","chip-violet","chip-amber","chip-indigo","chip-rose","chip-teal"];
  function renderMembers(){
    memberChips.innerHTML = members.map((m, i) => `
      <span class="member-chip ${CHIP_COLORS[i % CHIP_COLORS.length]}">
        ${m.name}
        <button data-id="${m.id}" data-name="${m.name}" title="বাদ দিন">✕</button>
      </span>`).join("");
    noMemberNote.style.display = members.length ? "none" : "block";
    noMemberWarn.style.display = members.length ? "none" : "block";
    const saveBtn = entryForm.querySelector(".kh-save-btn");
    if(saveBtn) saveBtn.disabled = !members.length;

    const opts = members.map(m => `<option value="${m.name}">${m.name}</option>`).join("");
    entryMember.innerHTML = opts || `<option value="">— সদস্য নেই —</option>`;

    const prevFilter = filterMember.value;
    filterMember.innerHTML = `<option value="সবাই">সবাই</option>` + opts;
    if([...filterMember.options].some(o => o.value === prevFilter)) filterMember.value = prevFilter;
  }

  /* ---------------- সদস্য যোগ করা ---------------- */
  addMemberBtn.addEventListener("click", async () => {
    const name = memberInput.value.trim();
    if(!name) return;
    if(members.some(m => m.name === name)){ memberInput.value = ""; return; }
    addMemberBtn.disabled = true;
    try{
      await addDoc(membersCol, { name });
      memberInput.value = "";
    }catch(err){
      alert("সদস্য যোগ করা যায়নি, ইন্টারনেট সংযোগ চেক করুন।");
      console.error(err);
    }finally{
      addMemberBtn.disabled = false;
    }
  });
  memberInput.addEventListener("keydown", e => {
    if(e.key === "Enter"){ e.preventDefault(); addMemberBtn.click(); }
  });

  /* ---------------- সদস্য বাদ দেওয়া ---------------- */
  memberChips.addEventListener("click", async e => {
    const btn = e.target.closest("button[data-id]");
    if(!btn) return;
    const { id, name } = btn.dataset;
    if(!confirm(`"${name}" কে সদস্য তালিকা থেকে বাদ দিতে চান? (পুরনো রেকর্ড মুছে যাবে না)`)) return;
    try{
      await deleteDoc(doc(db, "kh_members", id));
    }catch(err){
      alert("সদস্য বাদ দেওয়া যায়নি, আবার চেষ্টা করুন।");
      console.error(err);
    }
  });

  /* ---------------- স্ট্যাটাস টগল ---------------- */
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
    const saveBtn = entryForm.querySelector(".kh-save-btn");
    const status = entryForm.querySelector('input[name="status"]:checked').value;
    const record = {
      date: entryDate.value,
      member: entryMember.value,
      status: status,
      hours: status === "duty" ? (parseFloat(entryHours.value) || 0) : 0
    };
    if(saveBtn){ saveBtn.disabled = true; saveBtn.textContent = "সংরক্ষণ হচ্ছে..."; }
    try{
      await addDoc(recordsCol, record);
      entryHours.value = "";
    }catch(err){
      alert("রেকর্ড সংরক্ষণ করা যায়নি, ইন্টারনেট সংযোগ চেক করুন।");
      console.error(err);
    }finally{
      if(saveBtn){ saveBtn.disabled = !members.length; saveBtn.textContent = "রেকর্ড সংরক্ষণ করুন"; }
    }
  });

  /* ---------------- সামারি টেবিল (নির্বাচিত মাস অনুযায়ী) ---------------- */
  function recordsForSelectedMonth(){
    const month = summaryMonth.value; // "YYYY-MM"
    if(!month) return records;
    return records.filter(r => r.date && r.date.slice(0, 7) === month);
  }

  function renderSummary(){
    const tbody = document.querySelector("#summaryTable tbody");
    const noSummaryNote = document.getElementById("noSummaryNote");
    const monthRecords = recordsForSelectedMonth();
    if(!monthRecords.length){
      tbody.innerHTML = "";
      noSummaryNote.style.display = "block";
      return;
    }
    noSummaryNote.style.display = "none";
    const byMember = {};
    monthRecords.forEach(r => {
      if(!byMember[r.member]) byMember[r.member] = { days:0, leaves:0, hours:0 };
      if(r.status === "duty"){ byMember[r.member].days++; byMember[r.member].hours += r.hours; }
      else{ byMember[r.member].leaves++; }
    });
    tbody.innerHTML = Object.keys(byMember).map(name => {
      const d = byMember[name];
      return `<tr><td>${name}</td><td>${d.days}</td><td>${d.leaves}</td><td>${d.hours}</td></tr>`;
    }).join("");
  }

  summaryMonth.addEventListener("change", renderSummary);

  /* ---------------- CSV এক্সপোর্ট (নির্বাচিত মাস) ---------------- */
  exportMonthBtn.addEventListener("click", () => {
    const month = summaryMonth.value;
    const monthRecords = recordsForSelectedMonth().slice().sort((a,b) => a.date.localeCompare(b.date));
    if(!monthRecords.length){ alert("এই মাসে কোনো রেকর্ড নেই।"); return; }
    const header = "তারিখ,নাম,স্ট্যাটাস,ঘণ্টা\n";
    const rows = monthRecords.map(r =>
      `${r.date},${r.member},${r.status === "duty" ? "ডিউটি" : "ছুটি"},${r.status === "duty" ? r.hours : 0}`
    ).join("\n");
    const csv = "\uFEFF" + header + rows;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hajira-report-${month || "all"}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  /* ---------------- এই মাসের হিসাব মুছে ফেলা ---------------- */
  closeMonthBtn.addEventListener("click", async () => {
    const month = summaryMonth.value;
    const monthRecords = recordsForSelectedMonth();
    if(!monthRecords.length){ alert("এই মাসে মুছে ফেলার মতো কোনো রেকর্ড নেই।"); return; }
    if(!confirm(`"${month}" মাসের সব হাজিরা রেকর্ড স্থায়ীভাবে মুছে ফেলতে চান? এই কাজটি ফিরিয়ে আনা যাবে না। ডাউনলোড করে কপি রাখা হয়েছে তো?`)) return;
    closeMonthBtn.disabled = true;
    closeMonthBtn.textContent = "মুছে ফেলা হচ্ছে...";
    try{
      await Promise.all(monthRecords.map(r => deleteDoc(doc(db, "kh_records", r.id))));
    }catch(err){
      alert("মুছে ফেলা যায়নি, আবার চেষ্টা করুন।");
      console.error(err);
    }finally{
      closeMonthBtn.disabled = false;
      closeMonthBtn.textContent = "🗑️ এই মাসের হিসাব মুছে ফেলুন";
    }
  });

  /* ---------------- রেজিস্টার টেবিল (সব সময়ের, সদস্য দিয়ে ফিল্টার) ---------------- */
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
    try{
      await deleteDoc(doc(db, "kh_records", btn.dataset.id));
    }catch(err){
      alert("এন্ট্রি মুছা যায়নি, আবার চেষ্টা করুন।");
      console.error(err);
    }
  });

  filterMember.addEventListener("change", renderRegister);

  /* ---------------- Firestore থেকে লাইভ ডেটা শোনা (Real-time sync) ---------------- */
  onSnapshot(query(membersCol), snap => {
    members = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderMembers();
    if(syncStatus) syncStatus.textContent = "✅ সংযুক্ত — লাইভ সিঙ্ক চালু";
  }, err => {
    console.error(err);
    memberChips.innerHTML = `<span style="color:#c0392b;">সংযোগ করা যায়নি — ইন্টারনেট চেক করুন।</span>`;
    if(syncStatus) syncStatus.textContent = "⚠️ সংযোগ বিচ্ছিন্ন";
  });

  onSnapshot(query(recordsCol), snap => {
    records = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderSummary();
    renderRegister();
  }, err => console.error(err));

});
