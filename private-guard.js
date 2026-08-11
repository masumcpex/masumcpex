/* ==========================================================================
   private-guard.js
   unpublished.html / nasir.html / nazim.html / borhan.html / amar-golpo.html
   — এই পেজগুলোতে আলাদা কোনো "Continue with Google" বাটন নেই।

   এখানে শুধু চেক করা হয়:
     ১) localStorage-এ আনলক ফ্ল্যাগ আছে কিনা (আগে হোমপেজে Google+Password
        দিয়ে আনলক করা হয়েছিল কিনা)
     ২) Firebase Auth session এখনো valid কিনা
     ৩) সেই uid Firestore-এর approvedPrivateUsers-এ আছে কিনা

   এই তিনটার যেকোনো একটা fail করলে → সরাসরি index.html#private-chapters
   এ রিডাইরেক্ট, যেখানে একমাত্র লগইন এন্ট্রি পয়েন্ট আছে।

   মনে রাখবেন: এই ফাইলটা শুধু UX (কোন পেজ দেখানো হবে) নিয়ন্ত্রণ করে।
   আসল কনটেন্ট প্রোটেকশন Firestore Security Rules থেকেই আসে — approved না
   হলে privateChapters ডকুমেন্ট read-ই হবে না, এই গার্ড থাকুক বা না থাকুক।
   ========================================================================== */

import { auth, db, doc, getDoc, onAuthStateChanged, signOut } from "./firebase.js";
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

  signOutBtn?.addEventListener("click", async () => {
    try { await signOut(auth); } catch (err) { console.error(err); }
    localStorage.removeItem(UNLOCK_KEY);
    redirectHome();
  });

  onAuthStateChanged(auth, async (user) => {
    if (!user) { redirectHome(); return; }
    try {
      const snap = await getDoc(doc(db, "approvedPrivateUsers", user.email));
      if (!snap.exists()) {
        localStorage.removeItem(UNLOCK_KEY);
        redirectHome();
        return;
      }
      if (contentEl) contentEl.style.display = "";
      if (typeof onReady === "function") onReady(user.uid, user);
    } catch (err) {
      console.error(err);
      redirectHome();
    }
  });
}
