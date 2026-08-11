/* ==========================================================================
   private-guard.js
   unpublished.html / nasir.html / nazim.html / borhan.html / amar-golpo.html
   — এই পেজগুলোতে কোনো password ফর্ম নেই।

   এখানে শুধু চেক করা হয়: localStorage-এ আনলক ফ্ল্যাগ আছে কিনা (আগে
   index.html-এর #private-chapters সেকশনে সঠিক password দিয়ে আনলক করা
   হয়েছিল কিনা — private-access.js দেখুন)।

   ফ্ল্যাগ না থাকলে → সরাসরি index.html#private-chapters এ রিডাইরেক্ট,
   যেখানে একমাত্র password এন্ট্রি পয়েন্ট আছে।

   এই ফাইলটা WorkTrack-এর Google/Firebase Login থেকে সম্পূর্ণ স্বতন্ত্র —
   কোনো Firebase/Firestore ব্যবহার করে না।
   ========================================================================== */

import { UNLOCK_KEY } from "./private-access.js";

export function guardPrivatePage({ contentId, signOutBtnId, onReady }) {
  const contentEl = document.getElementById(contentId);
  const signOutBtn = signOutBtnId ? document.getElementById(signOutBtnId) : null;

  function redirectHome() {
    window.location.href = "index.html#private-chapters";
  }

  if (localStorage.getItem(UNLOCK_KEY) !== "1") {
    redirectHome();
    return;
  }

  signOutBtn?.addEventListener("click", () => {
    localStorage.removeItem(UNLOCK_KEY);
    redirectHome();
  });

  if (contentEl) contentEl.style.display = "";
  if (typeof onReady === "function") onReady();
}
