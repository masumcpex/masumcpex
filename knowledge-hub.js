/* ==========================================================================
   knowledge-hub.js
   সব ডেটা এই ব্রাউজার/ডিভাইসের localStorage-এ সংরক্ষিত থাকে।
   তাই আপনার মোবাইলে যোগ করা নামগুলো শুধু আপনার মোবাইলেই দেখাবে;
   অন্য কেউ অন্য ডিভাইস/ব্রাউজারে এই পেজ খুললে তাদের জন্য এটি ফাঁকা শুরু হবে।
   ========================================================================== */

const KH_MEMBERS_KEY = "kh_members";
const KH_RECORDS_KEY = "kh_records";

function khLoadMembers(){
  try{ return JSON.parse(localStorage.getItem(KH_MEMBERS_KEY)) || []; }catch(e){ return []; }
}
function khSaveMembers(list){ localStorage.setItem(KH_MEMBERS_KEY, JSON.stringify(list)); }

function khLoadRecords(){
  try{ return JSON.parse(localStorage.getItem(KH_RECORDS_KEY)) || []; }catch(e){ return []; }
}
function khSaveRecords(list){ localStorage.setItem(KH_RECORDS_KEY, JSON.stringify(list)); }

document.addEventListener("DOMContentLoaded", () => {

  let members = khLoadMembers();
  let records = khLoadRecords();

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

  entryDate.value = new Date().toISOString().slice(0,10);

  /* ---------------- সদস্য রেন্ডার ---------------- */
  const CHIP_COLORS = ["chip-mint","chip-sky","chip-coral","chip-violet","chip-amber","chip-indigo","chip-rose","chip-teal"];
  function renderMembers(){
    memberChips.innerHTML = members.map((name, i) => `
      <span class="member-chip ${CHIP_COLORS[i % CHIP_COLORS.length]}">
        ${name}
        <button data-name="${name}" title="বাদ দিন">✕</button>
      </span>`).join("");
    noMemberNote.style.display = members.length ? "none" : "block";
    noMemberWarn.style.display = members.length ? "none" : "block";
    entryForm.querySelector(".kh-save-btn").disabled = !members.length;

    const opts = members.map(n => `<option value="${n}">${n}</option>`).join("");
    entryMember.innerHTML = opts || `<option value="">— সদস্য নেই —</option>`;
    filterMember.innerHTML = `<option value="সবাই">সবাই</option>` + opts;
  }

  document.getElementById("addMemberBtn").addEventListener("click", () => {
    const name = memberInput.value.trim();
    if(!name) return;
    if(members.includes(name)){ memberInput.value = ""; return; }
    members.push(name);
    khSaveMembers(members);
    memberInput.value = "";
    renderMembers();
  });
  memberInput.addEventListener("keydown", e => {
    if(e.key === "Enter"){ e.preventDefault(); document.getElementById("addMemberBtn").click(); }
  });

  memberChips.addEventListener("click", e => {
    const btn = e.target.closest("button[data-name]");
    if(!btn) return;
    const name = btn.dataset.name;
    if(!confirm(`"${name}" কে সদস্য তালিকা থেকে বাদ দিতে চান? (পুরনো রেকর্ড মুছে যাবে না)`)) return;
    members = members.filter(m => m !== name);
    khSaveMembers(members);
    renderMembers();
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
  entryForm.addEventListener("submit", e => {
    e.preventDefault();
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
    khSaveRecords(records);
    entryHours.value = "";
    renderSummary();
    renderRegister();
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

  document.querySelector("#registerTable tbody").addEventListener("click", e => {
    const btn = e.target.closest(".row-delete");
    if(!btn) return;
    if(!confirm("এই এন্ট্রিটি মুছে ফেলতে চান?")) return;
    records = records.filter(r => r.id !== btn.dataset.id);
    khSaveRecords(records);
    renderSummary();
    renderRegister();
  });

  filterMember.addEventListener("change", renderRegister);

  renderMembers();
  renderSummary();
  renderRegister();
});
