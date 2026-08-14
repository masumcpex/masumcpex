/* ==========================================================================
   khAppPublic.js
   পাবলিক "শুধু দেখার" পেজের জন্য — কোনো লগইন লাগে না, কোনো Add/Edit/Delete/
   Export বাটন নেই।

   URL-এ ?id=JAKIR-0001 থাকলে শুধু সেই নির্দিষ্ট সদস্যের হাজিরা দেখাবে
   (ব্যক্তিগত শেয়ার লিংক)। ?id= না থাকলে আগের মতোই সবার সামারি+রেজিস্টার
   একসাথে দেখাবে (এডমিনের সাধারণ ওভারভিউ)।

   এটা khApp.js থেকে সম্পূর্ণ আলাদা ফাইল — এডমিন পেজের কোনো কোড এখানে
   ছোঁয়া হয়নি, এডমিন পেজ ঠিক আগের মতোই কাজ করবে।

   ⚠️ নিরাপত্তা সম্পর্কে সততার কথা: Member ID URL-এ থাকে বলে এটা একটা
   "গোপন লিংক"-এর মতো কাজ করে (যাকে দেবেন সে-ই দেখতে পারবে), কিন্তু
   Firestore rules "allow read: if true" থাকায় টেকনিক্যালি কেউ চাইলে
   ব্রাউজার ডেভেলপার টুলস দিয়ে সরাসরি ডেটাবেজ কোয়েরি করেও অন্যদের তথ্য
   দেখতে পারবে। এটা লগইন-ভিত্তিক কড়া নিরাপত্তা না, বরং "যার কাছে লিংক
   আছে সে দেখতে পারবে" ধরনের সুবিধা — হাজিরার মতো কম-স্পর্শকাতর তথ্যের
   জন্য সাধারণত যথেষ্ট, কিন্তু সেটা মাথায় রাখা ভালো।
   ========================================================================== */

import { db, collection, onSnapshot } from "./firebase.js";

const membersCol = collection(db, "kh_members");
const recordsCol = collection(db, "kh_records");

let members = [];
let records = [];

const urlParams = new URLSearchParams(window.location.search);
const targetMemberId = urlParams.get("id"); // যেমন "JAKIR-0001", না থাকলে null

const EN_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
function toBn(n){ return String(n); } // ইন্টারফেস এখন ইংরেজি, তাই প্লেইন সংখ্যা
function monthLabel(ym){
  const [y, m] = ym.split("-").map(Number);
  return `${EN_MONTHS[m-1]} ${y}`;
}
function currentYearMonth(){ return new Date().toISOString().slice(0,7); }

document.addEventListener("DOMContentLoaded", () => {
  const filterMember   = document.getElementById("filterMember");
  const filterRow       = document.getElementById("filterRow");
  const registerGroups = document.getElementById("registerGroups");
  const registerLoading = document.getElementById("registerLoading");
  const noRecordsNote  = document.getElementById("noRecordsNote");
  const noSummaryNote  = document.getElementById("noSummaryNote");
  const summarySection = document.getElementById("summarySection");
  const memberHeader   = document.getElementById("memberHeader");
  const currentMonthCard = document.getElementById("currentMonthCard");
  const notFoundNote   = document.getElementById("notFoundNote");

  let membersLoaded = false, recordsLoaded = false;
  function checkLoaded(){
    if(membersLoaded && recordsLoaded){
      registerLoading.style.display = "none";
      if(targetMemberId) renderMemberOnlyView();
    }
  }

  onSnapshot(membersCol, snapshot => {
    members = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a,b) => (a.name || "").localeCompare(b.name || "", "bn"));
    membersLoaded = true;
    if(!targetMemberId) renderFilterOptions();
    checkLoaded();
  }, err => {
    console.error(err);
    registerLoading.textContent = "Failed to load data — public read access is required in Firestore to view this page.";
  });

  onSnapshot(recordsCol, snapshot => {
    records = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    recordsLoaded = true;
    if(!targetMemberId){ renderSummary(records); renderRegister(records); }
    checkLoaded();
  }, err => {
    console.error(err);
    registerLoading.textContent = "Failed to load data — public read access is required in Firestore to view this page.";
  });

  /* ---------------- ?id= দেওয়া থাকলে: শুধু সেই একজনের ভিউ ---------------- */
  function renderMemberOnlyView(){
    const member = members.find(m => m.memberId === targetMemberId);
    if(!member){
      notFoundNote.style.display = "block";
      summarySection.style.display = "none";
      filterRow.style.display = "none";
      currentMonthCard.style.display = "none";
      return;
    }

    // এই পেজে শুধু এই একজনের তথ্যই দেখাবে বলে সদস্য-বাছাই ড্রপডাউন দরকার নেই
    filterRow.style.display = "none";

    memberHeader.style.display = "block";
    memberHeader.innerHTML = `
      <div class="kh-member-header-name">${member.name}</div>
      <div class="kh-member-header-id">Member ID: ${member.memberId}</div>`;

    const myRecords = records.filter(r => r.member === member.name);

    // চলতি মাসের সামারি আলাদাভাবে বড় করে দেখানো
    const ym = currentYearMonth();
    const thisMonth = myRecords.filter(r => r.date.startsWith(ym));
    const days = thisMonth.filter(r => r.status === "duty").length;
    const leaves = thisMonth.filter(r => r.status === "leave").length;
    const hours = thisMonth.filter(r => r.status === "duty").reduce((sum, r) => sum + (r.hours || 0), 0);

    currentMonthCard.style.display = "grid";
    currentMonthCard.innerHTML = `
      <div class="kh-stat-box"><span class="kh-stat-num">${toBn(days)}</span><span class="kh-stat-label">Work Days (${monthLabel(ym)})</span></div>
      <div class="kh-stat-box"><span class="kh-stat-num">${toBn(leaves)}</span><span class="kh-stat-label">Leave</span></div>
      <div class="kh-stat-box"><span class="kh-stat-num">${toBn(hours)}</span><span class="kh-stat-label">Total Work Hours</span></div>`;

    renderSummary(myRecords);
    renderRegister(myRecords);
  }

  function renderFilterOptions(){
    const current = filterMember.value;
    const opts = members.map(m => `<option value="${m.name}">${m.name}</option>`).join("");
    filterMember.innerHTML = `<option value="All">All</option>` + opts;
    if(current === "All" || members.some(m => m.name === current)) filterMember.value = current;
  }

  function renderSummary(sourceRecords){
    const tbody = document.querySelector("#summaryTable tbody");
    if(!sourceRecords.length){
      tbody.innerHTML = "";
      noSummaryNote.style.display = "block";
      return;
    }
    noSummaryNote.style.display = "none";
    const byMember = {};
    sourceRecords.forEach(r => {
      if(!byMember[r.member]) byMember[r.member] = { days:0, leaves:0, hours:0 };
      if(r.status === "duty"){ byMember[r.member].days++; byMember[r.member].hours += r.hours; }
      else{ byMember[r.member].leaves++; }
    });
    tbody.innerHTML = Object.keys(byMember).map(name => {
      const d = byMember[name];
      return `<tr><td>${name}</td><td>${d.days}</td><td>${d.leaves}</td><td>${d.hours}</td></tr>`;
    }).join("");
  }

  function renderRegister(sourceRecords){
    const filter = targetMemberId ? "All" : filterMember.value;
    const filtered = filter === "All" ? sourceRecords : sourceRecords.filter(r => r.member === filter);

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
          <td class="status-${r.status}">${r.status === "duty" ? "Present" : "Leave"}</td>
          <td>${r.status === "duty" ? r.hours : "—"}</td>
        </tr>`).join("");
      return `
        <details class="kh-month-group"${idx === 0 ? " open" : ""}>
          <summary class="kh-month-summary">
            <span class="kh-month-label">${monthLabel(ym)}</span>
            <span class="kh-month-count">${list.length} entries</span>
          </summary>
          <div class="table-wrap">
            <table class="kh-table">
              <thead><tr><th>Date</th><th>Name</th><th>Status</th><th>Hours</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </details>`;
    }).join("");
  }

  filterMember.addEventListener("change", () => renderRegister(records));
});
