/* ==========================================================================
   khAppPublic.js
   পাবলিক "শুধু দেখার" পেজের জন্য — কোনো লগইন লাগে না, কোনো Add/Edit/Delete/
   Export বাটন নেই। শুধু Summary আর মাস-ভিত্তিক Register পড়ে দেখানো হয়।

   এটা khApp.js থেকে সম্পূর্ণ আলাদা ফাইল — তাই এডমিন পেজের কোনো কোড এখানে
   ছোঁয়া হয়নি, এডমিন পেজ ঠিক আগের মতোই কাজ করবে।

   ⚠️ এই পেজ কাজ করতে হলে Firestore Rules-এ kh_members ও kh_records
   কালেকশনে পাবলিক read অনুমতি (allow read: if true;) দিতে হবে —
   write আগের মতোই শুধু লগইন করা মালিকের জন্য সীমাবদ্ধ থাকবে।
   ========================================================================== */

import { db, collection, onSnapshot } from "./firebase.js";

const membersCol = collection(db, "kh_members");
const recordsCol = collection(db, "kh_records");

let members = [];
let records = [];

const BN_MONTHS = ["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"];
const BN_DIGITS = ["০","১","২","৩","৪","৫","৬","৭","৮","৯"];
function toBn(n){ return String(n).split("").map(ch => /[0-9]/.test(ch) ? BN_DIGITS[ch] : ch).join(""); }
function monthLabel(ym){
  const [y, m] = ym.split("-").map(Number);
  return `${BN_MONTHS[m-1]} ${toBn(y)}`;
}

document.addEventListener("DOMContentLoaded", () => {
  const filterMember = document.getElementById("filterMember");
  const registerGroups = document.getElementById("registerGroups");
  const registerLoading = document.getElementById("registerLoading");
  const noRecordsNote = document.getElementById("noRecordsNote");
  const noSummaryNote = document.getElementById("noSummaryNote");

  let membersLoaded = false, recordsLoaded = false;
  function checkLoaded(){
    if(membersLoaded && recordsLoaded) registerLoading.style.display = "none";
  }

  onSnapshot(membersCol, snapshot => {
    members = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a,b) => (a.name || "").localeCompare(b.name || "", "bn"));
    membersLoaded = true;
    renderFilterOptions();
    checkLoaded();
  }, err => {
    console.error(err);
    registerLoading.textContent = "ডেটা লোড করতে সমস্যা হয়েছে — এই পেজ দেখতে Firestore-এ পাবলিক read অনুমতি প্রয়োজন।";
  });

  onSnapshot(recordsCol, snapshot => {
    records = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    recordsLoaded = true;
    renderSummary();
    renderRegister();
    checkLoaded();
  }, err => {
    console.error(err);
    registerLoading.textContent = "ডেটা লোড করতে সমস্যা হয়েছে — এই পেজ দেখতে Firestore-এ পাবলিক read অনুমতি প্রয়োজন।";
  });

  function renderFilterOptions(){
    const current = filterMember.value;
    const opts = members.map(m => `<option value="${m.name}">${m.name}</option>`).join("");
    filterMember.innerHTML = `<option value="সবাই">সবাই</option>` + opts;
    if(current === "সবাই" || members.some(m => m.name === current)) filterMember.value = current;
  }

  function renderSummary(){
    const tbody = document.querySelector("#summaryTable tbody");
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

  function renderRegister(){
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
        </tr>`).join("");
      return `
        <details class="kh-month-group"${idx === 0 ? " open" : ""}>
          <summary class="kh-month-summary">
            <span class="kh-month-label">${monthLabel(ym)}</span>
            <span class="kh-month-count">${toBn(list.length)}টি এন্ট্রি</span>
          </summary>
          <div class="table-wrap">
            <table class="kh-table">
              <thead><tr><th>তারিখ</th><th>নাম</th><th>স্ট্যাটাস</th><th>ঘণ্টা</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </details>`;
    }).join("");
  }

  filterMember.addEventListener("change", renderRegister);
});
