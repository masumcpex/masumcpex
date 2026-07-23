/* ==========================================================================
   knowledge-hub.js
   এখন ডেটা Firestore-এ রিয়েলটাইম সিঙ্ক হয় — তাই যেকোনো ডিভাইস থেকে
   দেখলে সবাই একই তথ্য দেখবে। নতুন এন্ট্রি যোগ/সম্পাদনা/মোছা শুধু
   এডমিন (Google লগইন করা masumcpex@gmail.com) করতে পারবে।
   Firestore সংযোগ না থাকলে এই ব্রাউজারের localStorage ক্যাশ থেকে
   পড়ে (offline fallback), যাতে সাইট পুরোপুরি ভেঙে না যায়।
   ========================================================================== */

import { khOnAuthChange, khSignIn, khSignOut, khWatchDoc, khSaveDoc, khLogEvent } from "./firebase.js";

const KH_MEMBERS_KEY = "kh_members";
const KH_RECORDS_KEY = "kh_records";

// ============================================================
// "এই মাসের হিসাব মুছে ফেলুন" বাটনের পাসওয়ার্ড — শুধু এই একটা জায়গায়
// বদলালেই যথেষ্ট, কোথাও আর ছুঁতে হবে না।
// ============================================================
const KH_DELETE_PASSWORD = "********"; // এখানে আপনার নিজের পাসওয়ার্ড বসান

function khLoadMembersLocal(){
  try{ return JSON.parse(localStorage.getItem(KH_MEMBERS_KEY)) || []; }catch(e){ return []; }
}
function khCacheMembersLocal(list){ localStorage.setItem(KH_MEMBERS_KEY, JSON.stringify(list)); }
function khLoadRecordsLocal(){
  try{ return JSON.parse(localStorage.getItem(KH_RECORDS_KEY)) || []; }catch(e){ return []; }
}
function khCacheRecordsLocal(list){ localStorage.setItem(KH_RECORDS_KEY, JSON.stringify(list)); }

document.addEventListener("DOMContentLoaded", () => {

  let members = khLoadMembersLocal();   // Firestore সংযোগ না আসা পর্যন্ত local ক্যাশ দেখানো হয়
  let records = khLoadRecordsLocal();
  let isAdmin = false;

  const memberChips   = document.getElementById("memberChips");
  const noMemberNote  = document.getElementById("noMemberNote");
  const noMemberWarn  = document.getElementById("noMemberWarn");
  const memberInput   = document.getElementById("memberInput");
  const addMemberBtn  = document.getElementById("addMemberBtn");
  const entryMember   = document.getElementById("entryMember");
  const filterMember  = document.getElementById("filterMember");
  const entryDate     = document.getElementById("entryDate");
  const entryHours    = document.getElementById("entryHours");
  const hoursField    = document.getElementById("hoursField");
  const entryForm     = document.getElementById("entryForm");
  const summaryMonth  = document.getElementById("summaryMonth");
  const exportMonthBtn= document.getElementById("exportMonthBtn");
  const closeMonthBtn = document.getElementById("closeMonthBtn");
  const khAuthStatus  = document.getElementById("khAuthStatus");
  const khLoginBtn    = document.getElementById("khLoginBtn");
  const khLogoutBtn   = document.getElementById("khLogoutBtn");

  entryDate.value = new Date().toISOString().slice(0,10);
  summaryMonth.value = new Date().toISOString().slice(0,7);

  /* ---------------- এডমিন অথ স্টেট ---------------- */
  function applyAdminUI(){
    khLoginBtn.style.display  = isAdmin ? "none" : "inline-block";
    khLogoutBtn.style.display = isAdmin ? "inline-block" : "none";
    khAuthStatus.textContent  = isAdmin
      ? "🔑 এডমিন হিসেবে লগইন করা আছে — এডিট করতে পারবেন"
      : "🔓 পাবলিক ভিউ — শুধু দেখা যাচ্ছে (এন্ট্রি সেভ করতে এডমিন লগইন প্রয়োজন)";

    // শুধু "সেভ/মুছুন" জাতীয় বাটনগুলোই এডমিন-নির্ভর — বাকি ইনপুট (তারিখ,
    // ঘণ্টা, ড্রপডাউন) সবসময় স্বাভাবিকভাবে ব্যবহারযোগ্য থাকবে, যাতে পাতাটা
    // "ভাঙা" মনে না হয়। সেভ করার সময় আবার isAdmin চেক হয়, তাই নিরাপত্তা ঠিক থাকে।
    addMemberBtn.disabled = !isAdmin;
    entryForm.querySelector(".kh-save-btn").disabled = !isAdmin || !members.length;
    exportMonthBtn.disabled = false; // ডাউনলোড সবাই করতে পারবে, এটা শুধু পড়া
    closeMonthBtn.style.display = isAdmin ? "inline-block" : "none";
  }

  khOnAuthChange((adminFlag) => {
    isAdmin = adminFlag;
    applyAdminUI();
    renderMembers();
    renderSummary();
    renderRegister();
  });

  khLoginBtn.addEventListener("click", () => {
    khSignIn().catch(err => alert("লগইন ব্যর্থ হয়েছে: " + err.message));
  });
  khLogoutBtn.addEventListener("click", () => { khSignOut(); });

  /* ---------------- Firestore রিয়েলটাইম সিঙ্ক ---------------- */
  khWatchDoc("members", (list) => {
    if(list === null){ members = khLoadMembersLocal(); } // সংযোগ সমস্যা → local ক্যাশ
    else{ members = list; khCacheMembersLocal(list); }
    renderMembers();
  });
  khWatchDoc("records", (list) => {
    if(list === null){ records = khLoadRecordsLocal(); }
    else{ records = list; khCacheRecordsLocal(list); }
    renderSummary();
    renderRegister();
  });

  function saveMembers(){ khSaveDoc("members", members).catch(e=>alert("সেভ ব্যর্থ: "+e.message)); khCacheMembersLocal(members); }
  function saveRecords(){ khSaveDoc("records", records).catch(e=>alert("সেভ ব্যর্থ: "+e.message)); khCacheRecordsLocal(records); }

  /* ---------------- সদস্য রেন্ডার ---------------- */
  const CHIP_COLORS = ["chip-mint","chip-sky","chip-coral","chip-violet","chip-amber","chip-indigo","chip-rose","chip-teal"];
  function renderMembers(){
    memberChips.innerHTML = members.map((name, i) => `
      <span class="member-chip ${CHIP_COLORS[i % CHIP_COLORS.length]}">
        ${name}
        ${isAdmin ? `<button data-name="${name}" title="বাদ দিন">✕</button>` : ""}
      </span>`).join("");
    noMemberNote.style.display = members.length ? "none" : "block";
    noMemberWarn.style.display = members.length ? "none" : "block";
    applyAdminUI();

    const opts = members.map(n => `<option value="${n}">${n}</option>`).join("");
    entryMember.innerHTML = opts || `<option value="">— সদস্য নেই —</option>`;
    filterMember.innerHTML = `<option value="সবাই">সবাই</option>` + opts;
  }

  addMemberBtn.addEventListener("click", () => {
    if(!isAdmin) return;
    const name = memberInput.value.trim();
    if(!name) return;
    if(members.includes(name)){ memberInput.value = ""; return; }
    members.push(name);
    saveMembers();
    memberInput.value = "";
    khLogEvent("kh_add_member");
  });
  memberInput.addEventListener("keydown", e => {
    if(e.key === "Enter"){ e.preventDefault(); addMemberBtn.click(); }
  });

  memberChips.addEventListener("click", e => {
    if(!isAdmin) return;
    const btn = e.target.closest("button[data-name]");
    if(!btn) return;
    const name = btn.dataset.name;
    if(!confirm(`"${name}" কে সদস্য তালিকা থেকে বাদ দিতে চান? (পুরনো রেকর্ড মুছে যাবে না)`)) return;
    members = members.filter(m => m !== name);
    saveMembers();
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
  entryForm.addEventListener("submit", e => {
    e.preventDefault();
    if(!isAdmin){ alert("এন্ট্রি সেভ করতে আগে উপরের 'Google দিয়ে এডমিন লগইন' বাটনে চাপুন।"); return; }
    if(!members.length) return;
    const status = entryForm.querySelector('input[name="status"]:checked').value;
    const record = {
      id: "r" + Date.now(),
      date: entryDate.value,
      member: entryMember.value,
      status: status,
      hours: status === "duty" ? (parseFloat(entryHours.value) || 0) : 0
    };
    records.push(record);
    saveRecords();
    entryHours.value = "";
    khLogEvent("kh_add_record");
  });

  /* ---------------- সামারি টেবিল (নির্বাচিত মাস অনুযায়ী) ---------------- */
  function renderSummary(){
    const tbody = document.querySelector("#summaryTable tbody");
    const noSummaryNote = document.getElementById("noSummaryNote");
    const month = summaryMonth.value;
    const monthRecords = records.filter(r => r.date.startsWith(month));
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

  /* ---------------- CSV ডাউনলোড (সবাই করতে পারবে — শুধু পড়া) ---------------- */
  exportMonthBtn.addEventListener("click", () => {
    const month = summaryMonth.value;
    const monthRecords = records.filter(r => r.date.startsWith(month));
    if(!monthRecords.length){ alert("এই মাসে কোনো রেকর্ড নেই।"); return; }
    let csv = "তারিখ,নাম,স্ট্যাটাস,ঘণ্টা\n";
    monthRecords.slice().sort((a,b)=>a.date.localeCompare(b.date)).forEach(r=>{
      csv += `${r.date},${r.member},${r.status === "duty" ? "ডিউটি" : "ছুটি"},${r.status === "duty" ? r.hours : 0}\n`;
    });
    const blob = new Blob(["\uFEFF"+csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `hajira-report-${month}.csv`; a.click();
    URL.revokeObjectURL(url);
    khLogEvent("kh_export_csv");
  });

  /* ---------------- মাসের হিসাব মুছে ফেলুন (শুধু এডমিন + পাসওয়ার্ড) ---------------- */
  closeMonthBtn.addEventListener("click", () => {
    if(!isAdmin) return; // ভিজিটর এই বাটন দেখতেই পায় না, তবু ডাবল-চেক

    const enteredPassword = prompt("🔒 এই মাসের হিসাব মুছতে পাসওয়ার্ড দিন:");
    if(enteredPassword === null) return; // ক্যান্সেল করা হয়েছে
    if(enteredPassword !== KH_DELETE_PASSWORD){
      alert("❌ Incorrect password. Access denied.");
      return;
    }

    const month = summaryMonth.value;
    const monthRecords = records.filter(r => r.date.startsWith(month));
    if(!monthRecords.length){ alert("এই মাসে মোছার মতো কোনো রেকর্ড নেই।"); return; }
    const ok1 = confirm(`"${month}" মাসের ${monthRecords.length}টি রেকর্ড স্থায়ীভাবে মুছে ফেলা হবে।\n\nআপনি কি আগে "📥 ডাউনলোড" বাটনে চেপে একটা কপি সংরক্ষণ করেছেন?`);
    if(!ok1) return;
    const ok2 = confirm("Are you sure you want to permanently delete this month's attendance?");
    if(!ok2) return;
    records = records.filter(r => !r.date.startsWith(month));
    saveRecords();
    alert("এই মাসের হিসাব মুছে ফেলা হয়েছে। নতুন মাসের এন্ট্রি এখন থেকে শুরু করতে পারেন।");
    khLogEvent("kh_close_month");
  });

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
        <td>${isAdmin ? `<button class="row-delete" data-id="${r.id}" title="মুছুন">🗑️</button>` : ""}</td>
      </tr>`).join("");
  }

  document.querySelector("#registerTable tbody").addEventListener("click", e => {
    if(!isAdmin) return;
    const btn = e.target.closest(".row-delete");
    if(!btn) return;
    if(!confirm("এই এন্ট্রিটি মুছে ফেলতে চান?")) return;
    records = records.filter(r => r.id !== btn.dataset.id);
    saveRecords();
  });

  filterMember.addEventListener("change", renderRegister);

  applyAdminUI();
  renderMembers();
  renderSummary();
  renderRegister();
});
