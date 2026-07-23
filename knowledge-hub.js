/* ==========================================================================
   knowledge-hub.js  (নো-লগইন ভার্সন)
   কোনো লগইন ফর্ম নেই। Firebase নিজে থেকেই এই ডিভাইসকে একটা গোপন পরিচয়
   (anonymous UID) দিয়ে দেয়, এবং সেই UID দিয়ে খাতার মূল লজিক (khApp.js)
   চালু হয়। একই ব্রাউজারে ফিরে এলে ডেটা থেকে যায়; অন্য ব্রাউজার/ডিভাইসে
   গেলে নতুন খালি অ্যাকাউন্ট শুরু হয়।
   ========================================================================== */

import { khWhenReady } from "./firebase.js";
import { initKhApp } from "./khApp.js";

document.addEventListener("DOMContentLoaded", () => {
  khWhenReady(uid => initKhApp(uid));
});
