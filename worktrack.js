import { db, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query } from "./firebase.js";

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

  entryDate.value = new Date().toISOString().slice(0, 10);

  memberChips.innerHTML = `<span style="color:#7A6F5D; font-size:.9rem;">লোড হচ্ছে...</span>`;

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

       // Add Member
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

         // Remove Member
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

        //absent 
  entryForm.querySelectorAll('input[name="status"]').forEach(radio => {
    radio.addEventListener("change", () => {
      const isLeave = entryForm.querySelector('input[name="status"]:checked').value === "leave";
      entryHours.disabled = isLeave;
      hoursField.style.opacity = isLeave ? .5 : 1;
      if(isLeave) entryHours.value = "";
    });
  });

       //Anti Submit
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

    //same name
    const existing = records.find(r => r.member === record.member && r.date === record.date);
    if(existing){
      const oldDesc = existing.status === "duty" ? `${existing.hours} ঘণ্টা ডিউটি` : "ছুটি";
      const confirmMsg = `"${record.member}" এর জন্য ${record.date} তারিখে ইতিমধ্যে একটা এন্ট্রি আছে (${oldDesc})।\n\n"OK" চাপলে পুরনো এন্ট্রিটা নতুন তথ্য দিয়ে আপডেট হবে।\n"Cancel" চাপলে কিছুই সেভ হবে না।`;
      if(!confirm(confirmMsg)) return;

      if(saveBtn){ saveBtn.disabled = true; saveBtn.textContent = "আপডেট হচ্ছে..."; }
      try{
        await updateDoc(doc(db, "kh_records", existing.id), record);
        entryHours.value = "";
      }catch(err){
        alert("রেকর্ড আপডেট করা যায়নি, ইন্টারনেট সংযোগ চেক করুন।");
        console.error(err);
      }finally{
        if(saveBtn){ saveBtn.disabled = !members.length; saveBtn.textContent = "রেকর্ড সংরক্ষণ করুন"; }
      }
      return;
    }

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

           //Summery work 
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

       /// Registrar box
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

        //Firestore (Real-time sync)
  onSnapshot(query(membersCol), snap => {
    members = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderMembers();
  }, err => {
    console.error(err);
    memberChips.innerHTML = `<span style="color:#c0392b;">সংযোগ করা যায়নি — ইন্টারনেট চেক করুন।</span>`;
  });

  onSnapshot(query(recordsCol), snap => {
    records = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderSummary();
    renderRegister();
  }, err => console.error(err));

});
