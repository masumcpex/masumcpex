/* ==========================================================================
   private-guard.js
   nasir.html / amar-golpo.html / nazim.html / hafsa.html
   — এই পেজগুলোতে কোনো password ফর্ম নেই।

   প্রতিটা পেজের আসল কন্টেন্ট এখন HTML-এ plain text হিসেবে নেই — একটা
   <script type="application/json" id="{contentId}Cipher"> ট্যাগে AES-GCM
   এনক্রিপ্টেড অবস্থায় থাকে। এখানে শুধু চেক করা হয়: বৈধ সেশন key
   localStorage-এ আছে কিনা (index.html#private-chapters এ সঠিক password
   দিয়ে আনলক করার পর তৈরি হয় — private-access.js দেখুন)। থাকলে সেই key
   দিয়ে decrypt করে কন্টেন্ট বসানো হয়; না থাকলে বা decrypt ব্যর্থ হলে
   সরাসরি index.html#private-chapters এ পাঠিয়ে দেওয়া হয় — তাই ভুল/অনুপস্থিত
   key নিয়ে পেজ সোর্সে আসল লেখা কখনোই থাকে না, শুধু এনক্রিপ্টেড গোলমেলে
   টেক্সট থাকে।

   এই ফাইলটা WorkTrack-এর Google/Firebase Login থেকে সম্পূর্ণ স্বতন্ত্র —
   কোনো Firebase/Firestore ব্যবহার করে না।
   ========================================================================== */

import { getActiveSessionKey, clearSession, refreshSession } from "./private-access.js";

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  return bytes;
}
function b64ToBytes(b64) {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

export async function guardPrivatePage({ contentId, signOutBtnId, onReady }) {
  const contentEl = document.getElementById(contentId);

  function redirectHome() {
    window.location.href = "index.html#private-chapters";
  }

  const hexKey = getActiveSessionKey();
  if (!hexKey) { redirectHome(); return; }

  const cipherEl = document.getElementById(contentId + "Cipher");
  if (!cipherEl) { redirectHome(); return; }

  let payload;
  try {
    payload = JSON.parse(cipherEl.textContent);
  } catch (e) {
    redirectHome();
    return;
  }

  try {
    const aesKey = await crypto.subtle.importKey(
      "raw", hexToBytes(hexKey), { name: "AES-GCM" }, false, ["decrypt"]
    );
    const plainBuf = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: b64ToBytes(payload.iv) }, aesKey, b64ToBytes(payload.ct)
    );
    contentEl.innerHTML = new TextDecoder().decode(plainBuf);
  } catch (e) {
    // ভুল/মেয়াদোত্তীর্ণ key দিয়ে decrypt ব্যর্থ হলে সেশন মুছে আবার password চাওয়া হয়
    clearSession();
    redirectHome();
    return;
  }

  // সক্রিয়ভাবে এই পেজ দেখছে মানেই সেশনের মেয়াদ আরও ১ ঘণ্টা বেড়ে গেল
  refreshSession();

  // innerHTML বসানোর পর পুরনো element রিপ্লেস হয়ে গেছে, তাই সাইনআউট বাটন
  // নতুন করে খুঁজে event লাগাতে হবে
  const signOutBtn = signOutBtnId ? document.getElementById(signOutBtnId) : null;
  signOutBtn?.addEventListener("click", () => {
    clearSession();
    redirectHome();
  });

  contentEl.style.display = "";
  if (typeof onReady === "function") onReady();
}
