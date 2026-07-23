/* ==========================================================================
   data.js
   এখানে সাইটের সব কনটেন্ট (বই, জার্নাল, আর্টিকেল, প্রজেক্ট) থাকবে।
   ========================================================================== */

const SITE_DATA = {

  /* ---------------- হিরো সেকশন ---------------- */
  hero: {
    photo: "https://masumcpex.github.io/masumcpex/1000004949.jpg",
    name: "Masum Billah",
    role: "Writer • Learner • Builder",
    tagline: "Learning never stops. Build something meaningful every day.",
    ctaText: "আমার বইসমূহ দেখুন",
    ctaLink: "#library"
  },

  /* ---------------- About সেকশন ---------------- */
  about: {
    title: "আমি মাসুম",
    photo: "https://masumcpex.github.io/masumcpex/masum.png",
    paragraphs: [
      "আমি মাসুম। বই লিখতে ভালোবাসি, অনুভূতি ও জীবনের ছোট ছোট শিক্ষা ছড়িয়ে দিতে পছন্দ করি — একই সাথে স্মার্ট ওয়েব টুলস তৈরি করি।",
      "লেখালেখি আমার কাছে অনুভূতি প্রকাশের একটি অন্যতম মাধ্যম। পাশাপাশি প্রোডাক্টিভ কোডিং সলিউশন তৈরি করে জীবনকে সহজ করতে আমি পছন্দ করি।"
    ],
    stats: [
      { number: "৬টি", label: "সংরক্ষিত ই-বুক" },
      { number: "১টি", label: "কাজের ঘণ্টা ট্র্যাকার" },
      { number: "১০০%", label: "স্মার্ট ডিজাইন" }
    ]
  },

  /* ---------------- Library ---------------- */
  books: [
    {
      id: "book1",
      cover: "https://masumcpex.github.io/masumcpex/book1.png",
      title: "যার জন্যে কাঁদি সে কাঁদার যোগ্য নয়",
      category: "অনুপ্রেরণা ও জীবন",
      description: "হৃদয়ের গল্প ও আত্মোপলব্ধির সাবলীল সমন্বয়।",
      readingTime: "৩৫ মিনিট",
      pdfUrl: "https://drive.google.com/file/d/1ciB-tX7PDKU8ytY1Ja22iqE5_gydopoE/view?usp=drivesdk",
      readMoreUrl: "https://drive.google.com/file/d/1ciB-tX7PDKU8ytY1Ja22iqE5_gydopoE/view?usp=drivesdk",
      downloadUrl: "https://drive.google.com/uc?export=download&id=1ciB-tX7PDKU8ytY1Ja22iqE5_gydopoE",
      locked: false
    },
    {
      id: "book2",
      cover: "https://masumcpex.github.io/masumcpex/eka.jpg",
      title: "একাকিত্বের নোটবুক",
      category: "ভাবনা ও ডায়েরি",
      description: "নিঃসঙ্গতার প্রহরে ডায়েরির পাতায় আঁকা কিছু অনুভূতি।",
      readingTime: "২৫ মিনিট",
      pdfUrl: "https://drive.google.com/file/d/10q4PqYsGaV97mrpzry8J0h4mw94kcdlF/view?usp=drivesdk",
      readMoreUrl: "https://drive.google.com/file/d/10q4PqYsGaV97mrpzry8J0h4mw94kcdlF/view?usp=drivesdk",
      downloadUrl: "https://drive.google.com/uc?export=download&id=10q4PqYsGaV97mrpzry8J0h4mw94kcdlF",
      locked: false
    },
    {
      id: "book3",
      cover: "https://masumcpex.github.io/masumcpex/book3.png",
      title: "ইংলিশ শেখার সহজ রোডম্যাপ",
      category: "শিক্ষা ও ক্যারিয়ার",
      description: "সহজ গাইডলাইনে ইংরেজি শেখার সম্পূর্ণ পথ রেখা।",
      readingTime: "৪০ মিনিট",
      pdfUrl: "https://drive.google.com/file/d/1R3BcEq1E3dPNwdVMxgIpnYkqWNMHRncv/view?usp=drivesdk",
      readMoreUrl: "https://drive.google.com/file/d/1R3BcEq1E3dPNwdVMxgIpnYkqWNMHRncv/view?usp=drivesdk",
      downloadUrl: "https://drive.google.com/uc?export=download&id=1R3BcEq1E3dPNwdVMxgIpnYkqWNMHRncv",
      locked: false
    },
    {
      id: "book4",
      cover: "https://masumcpex.github.io/masumcpex/enhlishsmart.png",
      title: "Smart Spoken English",
      category: "ভাষা ও স্কিল",
      description: "স্মার্টলি ও অনর্গল ইংরেজি বলার প্র্যাক্টিক্যাল বই।",
      readingTime: "৩০ মিনিট",
      pdfUrl: "https://drive.google.com/file/d/1jCStUE4-T6l50Y1jKDI0_tAzqX-f8JZE/view?usp=drivesdk",
      readMoreUrl: "https://drive.google.com/file/d/1jCStUE4-T6l50Y1jKDI0_tAzqX-f8JZE/view?usp=drivesdk",
      downloadUrl: "https://drive.google.com/uc?export=download&id=1jCStUE4-T6l50Y1jKDI0_tAzqX-f8JZE",
      locked: false
    },
    {
      id: "book5",
      cover: "https://masumcpex.github.io/masumcpex/bookb.png",
      title: "Easy English Mastery",
      category: "ভাষা ও স্কিল",
      description: "সহজ নিয়মে ইংরেজি গ্রামার ও স্পোকেন আয়ত্ত করার গাইড।",
      readingTime: "৩২ মিনিট",
      pdfUrl: "https://drive.google.com/file/d/1BydwswVhKcKPrW7EPScfCyUEs6LXakN-/view?usp=drivesdk",
      readMoreUrl: "https://drive.google.com/file/d/1BydwswVhKcKPrW7EPScfCyUEs6LXakN-/view?usp=drivesdk",
      downloadUrl: "https://drive.google.com/uc?export=download&id=1BydwswVhKcKPrW7EPScfCyUEs6LXakN-",
      locked: false
    },
    {
      id: "book6",
      cover: "https://masumcpex.github.io/masumcpex/cpex.png",
      title: "চলার পথে আমার গল্প",
      category: "সিক্রেট / পার্সোনাল",
      description: "এই বইটি সবার জন্য উন্মুক্ত নয়। এটি একটি বিশেষ ব্যক্তিগত সংস্করণ।",
      readingTime: "—",
      pdfUrl: "#",
      readMoreUrl: "#",
      downloadUrl: "#",
      locked: true
    }
  ],

  /* ---------------- Journal ---------------- */
  journalCategories: ["সব", "ব্যক্তিগত গল্প", "অনুভূতি", "Daily Notes", "শেখার জার্নাল", "Life Lessons", "ভ্রমণ", "জীবন ও মানসিকতা"],

  journal: [
    {
      id: "j1",
      title: "আজকের একটি সাধারণ বিকেল",
      category: "Daily Notes",
      date: "২০২৬-০৭-১০",
      image: "",
      excerpt: "কিছু বিকেল থাকে যা বিশেষ কিছু না করেই মনে থেকে যায়...",
      content: "কিছু বিকেল থাকে যা বিশেষ কিছু না করেই মনে থেকে যায়। আজকের বিকেলটাও তেমন — চা, জানালার পাশে বসে থাকা, আর কিছু এলোমেলো চিন্তা।"
    },
    {
      id: "j2",
      title: "জীবন বদলানোর ৫টি ছোট কিন্তু শক্তিশালী অভ্যাস",
      category: "শেখার জার্নাল",
      date: "২০২৬-০৭-১৯",
      readingTime: "৬ মিনিট",
      image: "",
      excerpt: "জীবন বড় কোনো পরিবর্তনে নয়, বরং প্রতিদিনের ছোট ছোট অভ্যাসের মাধ্যমে বদলায়। এমন ৫টি অভ্যাস, যা গভীর ও ইতিবাচক প্রভাব ফেলবে...",
      content: `
        <div style="display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin-bottom:18px;">
          <span style="font-family:'Inter',sans-serif; font-size:.7rem; letter-spacing:.08em; font-weight:700; color:#1B2A45; background:#C79A3B; padding:5px 12px; border-radius:999px; text-transform:uppercase;">শেখার জার্নাল</span>
          <span style="font-family:'Inter',sans-serif; font-size:.78rem; color:#7A6F5D;">⏱ ৬ মিনিট পঠন</span>
          <span style="font-family:'Inter',sans-serif; font-size:.78rem; color:#7A6F5D;">• সর্বশেষ আপডেট: ১৯ জুলাই, ২০২৬</span>
        </div>

        <p style="background:#FBF7EC; padding:16px 18px; border-left:4px solid #C79A3B; font-family:'Noto Serif Bengali',serif; font-style:italic; font-size:1.05rem; margin:0 0 22px;">"জীবন বড় কোনো পরিবর্তনে নয়, বরং প্রতিদিনের ছোট ছোট অভ্যাসের মাধ্যমে বদলায়।"</p>

        <h3 style="color:#0E6E5C; margin-top:10px;">ভূমিকা</h3>
        <p>আমরা অনেকেই ভাবি জীবন বদলাতে হলে হয়তো রাতারাতি অলৌকিক কিছু করে ফেলতে হবে — ভোর ৫টায় উঠে দৌড়াতে হবে কিংবা হাজার পৃষ্ঠার বই পড়ে শেষ করতে হবে। কিন্তু বাস্তব সত্য হলো, জীবন বড় কোনো পরিবর্তনে নয়, বরং প্রতিদিনের ছোট ছোট অভ্যাসের মাধ্যমে বদলায়। আজকে আমরা এমন ৫টি ছোট অভ্যাস নিয়ে কথা বলব, যা আপনার জীবনে এক গভীর ও ইতিবাচক প্রভাব ফেলবে।</p>

        <h3 style="color:#0E6E5C; margin-top:25px;">কেন ছোট অভ্যাস বড় পরিবর্তন আনে</h3>
        <p>বড় লক্ষ্য অনেক সময় ভয় ধরিয়ে দেয়, আর তাই শুরু করার আগেই হাল ছেড়ে দিই। কিন্তু ছোট অভ্যাস প্রতিদিন সহজে করা যায়, আর সেই ধারাবাহিকতাই দীর্ঘমেয়াদে বিশাল ফলাফল এনে দেয়।</p>

        <h3 style="color:#0E6E5C; margin-top:25px;">১. সোশ্যাল মিডিয়া ফিডকে বানিয়ে ফেলুন 'লার্নিং ফিড'</h3>
        <p>আমরা প্রতিদিন একটা বড় সময় সোশ্যাল মিডিয়ায় স্ক্রোল করে পার করি। কেমন হতো যদি এই সময়টাই আপনার শেখার মাধ্যম হয়ে উঠত?</p>
        <div style="background:#ECE2C9; border-radius:10px; padding:16px 18px; margin:16px 0;">
          <p style="margin:0 0 8px;"><strong>✅ করণীয়:</strong> এমন সব পেজ, চ্যানেল বা আইডি ফলো করুন যা আপনাকে নতুন কিছু শেখায় বা অনুপ্রাণিত করে।</p>
          <p style="margin:0;"><strong>🚫 বর্জনীয়:</strong> যেসব অ্যাকাউন্ট আপনার মানসিক শান্তি নষ্ট করে বা নেতিবাচকতা ছড়ায়, সেগুলোকে এখনই আনফলো করে দিন।</p>
        </div>

        <h3 style="color:#0E6E5C; margin-top:25px;">২. প্রতিদিন অন্তত কয়েক পৃষ্ঠা বই বা অডিও বুক শুনুন</h3>
        <p>নিয়মিত বই পড়ার অভ্যাস মানুষের মনোযোগ, চিন্তাশক্তি এবং ধৈর্য বহুগুণ বাড়িয়ে দেয়। যদি কোনো কারণে বই পড়ার সময় বা অভ্যাস না পান, তবে অডিও বুক আপনার জন্য দারুণ বিকল্প হতে পারে।</p>
        <p style="background:#FBF7EC; padding:14px 18px; border-radius:8px; margin:16px 0;"><strong>পরামর্শ:</strong> যাতায়াতের সময় বা ঘুমানোর আগে অডিও বুক শুনতে পারেন। বাংলাদেশের সর্ববৃহৎ সিনেমেটিক অডিও বুক লাইব্রেরি 'পুথিকা' (Puthika) অ্যাপে ১০০০-এর বেশি অডিও বুক রয়েছে। 'Joyf' প্রমো কোড ব্যবহার করে সাবস্ক্রিপশনে ৫০% ডিসকাউন্টও পেতে পারেন।</p>

        <h3 style="color:#0E6E5C; margin-top:25px;">৩. কনজিউম কমিয়ে ক্রিয়েট করা বাড়িয়ে দিন</h3>
        <p>অনেকেই সারাদিন শুধু ভিডিও দেখেন বা তথ্য সংগ্রহ করেন, কিন্তু বাস্তবে কোনো অ্যাকশন নেন না। কেবল তথ্য গিললে হবে না, সেটাকে কাজে লাগাতে হবে — একটা পোস্ট লিখুন, ছোট ভিডিও বানান, বা যা শিখলেন তা অন্য কাউকে শিখিয়ে দিন।</p>
        <p style="background:#1B2A45; color:#F3ECDA; padding:18px; border-radius:8px; font-family:'Noto Serif Bengali',serif; text-align:center; margin:18px 0;">"শেখা তখনই সম্পূর্ণ হয়, যখন তা অন্যের সাথে ভাগ করা হয়।"</p>

        <h3 style="color:#0E6E5C; margin-top:25px;">৪. নিজের তুলনা অন্যের সঙ্গে নয়, গতকালকের নিজের সঙ্গে করুন</h3>
        <p>অন্যের জীবনের সাফল্যের সঙ্গে নিজের জীবনের তুলনা করলে কেবল হতাশাই বাড়বে। আপনার একমাত্র প্রতিযোগিতা হওয়া উচিত আপনার নিজের সাথে।</p>
        <div style="display:flex; gap:10px; margin:16px 0; flex-wrap:wrap;">
          <div style="flex:1; min-width:140px; background:#FBF7EC; border-radius:10px; padding:14px 16px;">
            <div style="font-family:'Inter',sans-serif; font-size:.72rem; letter-spacing:.06em; color:#7A6F5D; font-weight:700; text-transform:uppercase; margin-bottom:6px;">গতকাল</div>
            <div style="font-size:.92rem;">যা পারিনি, যেখানে আটকে ছিলাম</div>
          </div>
          <div style="flex:1; min-width:140px; background:#ECE2C9; border-radius:10px; padding:14px 16px;">
            <div style="font-family:'Inter',sans-serif; font-size:.72rem; letter-spacing:.06em; color:#0E6E5C; font-weight:700; text-transform:uppercase; margin-bottom:6px;">আজ</div>
            <div style="font-size:.92rem;">একটু বেশি ধৈর্য, একটু বেশি অগ্রগতি</div>
          </div>
        </div>

        <h3 style="color:#0E6E5C; margin-top:25px;">৫. ছোট ছোট অর্জনগুলোকে উদযাপন করতে শিখুন</h3>
        <p>আমরা সবসময় বড় সাফল্যের অপেক্ষায় থাকি এবং দৈনন্দিন ছোট ছোট অর্জনগুলোকে হেলাফেলা করি। কিন্তু বড় সাফল্য আসলে এই ছোট ছোট জয়েরই সমষ্টি।</p>
        <div style="background:#ECE2C9; border-left:4px solid #0E6E5C; border-radius:8px; padding:14px 18px; margin:16px 0;">🎉 আজকের দিনের লক্ষ্য পূরণ হলে নিজের প্রশংসা করুন — ছোট অর্জনের স্বীকৃতিই আত্মবিশ্বাস আর মনোবল বাড়ায়।</div>

        <h3 style="color:#0E6E5C; margin-top:30px;">✅ আজ থেকেই শুরু করুন</h3>
        <div style="background:#FBF7EC; border-radius:10px; padding:16px 20px; margin:14px 0;">
          <div style="padding:6px 0;">☐ Social Media পরিষ্কার</div>
          <div style="padding:6px 0;">☐ ১০ মিনিট পড়া</div>
          <div style="padding:6px 0;">☐ কিছু Create করা</div>
          <div style="padding:6px 0;">☐ নিজেকে গতকালের সাথে Compare করা</div>
          <div style="padding:6px 0;">☐ ছোট অর্জন Celebrate করা</div>
        </div>

        <h3 style="color:#0E6E5C; margin-top:30px;">প্রায়শই জিজ্ঞাসিত প্রশ্ন (FAQ)</h3>
        <details style="background:#FBF7EC; border-radius:8px; padding:10px 16px; margin-bottom:8px;"><summary style="cursor:pointer; font-weight:700; color:#1B2A45;">প্রতিদিন কতক্ষণ বই পড়া উচিত?</summary><p style="margin-top:8px;">জোর করে বেশি পড়ার দরকার নেই, দিনে মাত্র ২-৩ পৃষ্ঠা দিয়ে শুরু করুন।</p></details>
        <details style="background:#FBF7EC; border-radius:8px; padding:10px 16px; margin-bottom:8px;"><summary style="cursor:pointer; font-weight:700; color:#1B2A45;">Audiobook কি বইয়ের বিকল্প?</summary><p style="margin-top:8px;">হ্যাঁ, সময় না পেলে অডিও বুক দারুণ বিকল্প — যাতায়াতের সময় বা ঘুমানোর আগে শোনা যায়।</p></details>
        <details style="background:#FBF7EC; border-radius:8px; padding:10px 16px; margin-bottom:8px;"><summary style="cursor:pointer; font-weight:700; color:#1B2A45;">Create বলতে কী বোঝায়?</summary><p style="margin-top:8px;">শুধু তথ্য গ্রহণ না করে, শেখা জিনিসটা নিজের ভাষায় প্রকাশ করা — নোট, পোস্ট বা কাউকে শিখিয়ে বলা।</p></details>
        <details style="background:#FBF7EC; border-radius:8px; padding:10px 16px; margin-bottom:8px;"><summary style="cursor:pointer; font-weight:700; color:#1B2A45;">একদিন মিস করলে কী করব?</summary><p style="margin-top:8px;">নিজেকে দোষ না দিয়ে পরের দিন থেকেই আবার শুরু করুন। ধারাবাহিকতা মানে নিখুঁত হওয়া না।</p></details>
        <details style="background:#FBF7EC; border-radius:8px; padding:10px 16px; margin-bottom:8px;"><summary style="cursor:pointer; font-weight:700; color:#1B2A45;">Social Media কীভাবে Learning Tool হবে?</summary><p style="margin-top:8px;">শিক্ষামূলক ও অনুপ্রেরণাদায়ক পেজ/চ্যানেল ফলো করে, নেতিবাচক অ্যাকাউন্ট আনফলো করে।</p></details>
        <details style="background:#FBF7EC; border-radius:8px; padding:10px 16px; margin-bottom:8px;"><summary style="cursor:pointer; font-weight:700; color:#1B2A45;">ছোট অভ্যাস সত্যিই জীবন বদলায়?</summary><p style="margin-top:8px;">হ্যাঁ — বড় পরিবর্তন আসলে অনেক ছোট, ধারাবাহিক পদক্ষেপের যোগফল।</p></details>
        <details style="background:#FBF7EC; border-radius:8px; padding:10px 16px; margin-bottom:8px;"><summary style="cursor:pointer; font-weight:700; color:#1B2A45;">এই অভ্যাসগুলো ছাত্র ও চাকরিজীবীদের জন্য উপকারী?</summary><p style="margin-top:8px;">হ্যাঁ, দুই ক্ষেত্রেই সমানভাবে কার্যকর — বয়স বা পেশা নির্বিশেষে প্রযোজ্য।</p></details>
        <details style="background:#FBF7EC; border-radius:8px; padding:10px 16px; margin-bottom:14px;"><summary style="cursor:pointer; font-weight:700; color:#1B2A45;">কীভাবে ধারাবাহিকতা বজায় রাখব?</summary><p style="margin-top:8px;">প্রতিদিন রাতে নিজের ছোট অগ্রগতি লিখে রাখুন — এটাই ধারাবাহিকতার সবচেয়ে সহজ উপায়।</p></details>

        <h3 style="color:#0E6E5C; margin-top:25px;">আজকের শিক্ষা</h3>
        <p style="background:#ECE2C9; padding:14px 18px; border-left:4px solid #C79A3B; border-radius:8px; margin:14px 0;">একসময় আমি ভাবতাম জীবন বদলাতে হলে অনেক বড় কিছু করতে হবে। কিন্তু সত্যিটা হলো, জীবন বদলায় ছোট ছোট অভ্যাসে — আর পরিবর্তনের শুরুটা হোক আজ থেকেই।</p>

        <div style="background:linear-gradient(155deg,#1B2A45,#23375B); color:#fff; border-radius:14px; padding:18px 20px; margin:20px 0;">
          <div style="font-family:'Noto Serif Bengali',serif; color:#C79A3B; font-weight:700; margin-bottom:10px;">🔑 মূল শিক্ষা</div>
          <div style="padding:4px 0;">• ছোট অভ্যাস বড় পরিবর্তন আনে</div>
          <div style="padding:4px 0;">• শেখার জন্য প্রতিদিন সময় দিন</div>
          <div style="padding:4px 0;">• Create করা শুরু করুন</div>
          <div style="padding:4px 0;">• নিজের সাথে প্রতিযোগিতা করুন</div>
          <div style="padding:4px 0;">• ছোট অর্জন উদযাপন করুন</div>
        </div>

        <p style="text-align:center; font-family:'Noto Serif Bengali',serif; font-style:italic; color:#1B2A45; font-size:1.05rem; margin:22px 0;">"জীবন একদিনে বদলায় না। কিন্তু প্রতিদিনের ছোট অভ্যাস একদিন পুরো জীবন বদলে দেয়।"</p>

        <div style="text-align:center; margin-top:20px; font-weight:bold; color:#7A6F5D; border-top:1px solid #ECE2C9; padding-top:15px;">লিখেছেন: মাসুম</div>
      `
    },
    {
      id: "j3",
      title: "জীবনের একটি ছোট শিক্ষা",
      category: "Life Lessons",
      date: "২০২৬-০৬-২৮",
      image: "",
      excerpt: "সবকিছু পরিকল্পনা মতো হয় না — আর সেটাই মেনে নেওয়া শেখা দরকার...",
      content: "সবকিছু পরিকল্পনা মতো হয় না — আর সেটাই মেনে নেওয়া শেখা দরকার।"
    },
    {
      id: "j4",
      title: "Attention Economy: কেন ইনফ্লুয়েন্সারদের যুগে আমরা নিজেদের জীবনকে ব্যর্থ মনে করি?",
      category: "জীবন ও মানসিকতা",
      date: "২০২৬-০৭-১৯",
      readingTime: "২২ মিনিট",
      image: "",
      excerpt: "মনোযোগই আজকের বিশ্বের সবচেয়ে দামি পণ্য। ইনফ্লুয়েন্সার কালচার, অ্যালগরিদম আর সোশ্যাল কম্পারিজন কীভাবে আমাদের নিজেদের ব্যর্থ মনে করাচ্ছে — একটি গভীর বিশ্লেষণ।",
      url: "article-attention-economy.html",
      content: ""
    },
    {
      id: "j5",
      title: "অসমাপ্ত অনুভূতির ডায়েরি",
      category: "Daily Notes",
      date: "২০২৬-০৭-১৯",
      readingTime: "৯ মিনিট",
      image: "",
      excerpt: "ভালোবাসা, বন্ধুত্ব, কষ্ট, বিশ্বাস আর জীবনের ছোট ছোট উপলব্ধির একগুচ্ছ ভাঙা টুকরো — কিছু মুহূর্তের ডায়েরি, যা হয়তো আপনারও চেনা লাগবে।",
      url: "journal-unfinished-feelings.html",
      content: ""
    },
    {
      id: "j6",
      title: "Social Media Honey Trap: অনলাইন যৌন প্রতারণা ও ব্ল্যাকমেইলের নেপথ্য কাহিনি",
      category: "জীবন ও মানসিকতা",
      date: "২০২৬-০৭-১৯",
      readingTime: "১৪ মিনিট",
      image: "",
      excerpt: "Facebook, IMO, Bigo Live-এ ছড়িয়ে থাকা ভুয়া প্রোফাইল, হানি ট্র্যাপ কৌশল, ব্ল্যাকমেইল আর প্রবাসীদের টার্গেট করার পদ্ধতি নিয়ে একটি অনুসন্ধানী প্রতিবেদন — সাথে নিরাপত্তা টিপস।",
      url: "article-honeytrap-scam.html",
      content: ""
    },
    {
      id: "j7",
      title: "💔 আমার ব্যর্থ ভালোবাসার গল্প",
      category: "ব্যক্তিগত গল্প",
      date: "২০২৬-০৭-১৯",
      readingTime: "৮-১০ মিনিট",
      image: "",
      excerpt: "একটি নীরব ভালোবাসা, কিছু অপূর্ণ অপেক্ষা, আর নিজের ভেতরে লুকিয়ে রাখা অনুভূতির গল্প।",
      url: "journal-first-love-story.html",
      content: ""
    }
  ],
  articleCategories: ["সব", "বাংলাদেশের শিক্ষাব্যবস্থা", "ইংরেজি শেখা", "AI", "Programming", "Construction", "Productivity", "স্কিল ডেভেলপমেন্ট", "জীবন ও মানসিকতা", "সাইবার নিরাপত্তা", "Leadership"],

  articles: [
    {
      id: "a1",
      title: "বাংলাদেশের শিক্ষাব্যবস্থা: মূল সমস্যা কোথায়? সমাধান কী হতে পারে?",
      category: "বাংলাদেশের শিক্ষাব্যবস্থা",
      date: "২০২৬-০৭-১২",
      readingTime: "১৮ মিনিট",
      image: "education-banner.jpg",
      excerpt: "শিক্ষা একটি দেশের উন্নয়নের ভিত্তি। ভালো ফলাফল ও জিপিএর প্রতিযোগিতার বাইরে বাস্তব জীবনের জন্য কতটা প্রস্তুত হচ্ছে শিক্ষার্থীরা—সেটিই এখন সবচেয়ে বড় আলোচনার বিষয়।",
      content: `
        <p><strong>ভূমিকা:</strong> শিক্ষা একটি দেশের উন্নয়নের ভিত্তি। একটি ভালো শিক্ষাব্যবস্থা শুধু পরীক্ষায় ভালো ফল করার জন্য নয়, বরং দক্ষ, সৃজনশীল, নৈতিক ও সমস্যা সমাধানে সক্ষম মানুষ তৈরির জন্য কাজ করে।</p>
        <h3 style="color: #2c5282; margin-top: 25px;">১. মুখস্থবিদ্যার উপর অতিরিক্ত নির্ভরতা</h3>
        <p>আমাদের শিক্ষাব্যবস্থার অন্যতম বড় সমস্যা হলো মুখস্থনির্ভর শিক্ষা। এর ফলে অনেক শিক্ষার্থী ভালো ফল করলেও বাস্তব জীবনের চ্যালেঞ্জ মোকাবিলার দক্ষতা অর্জন করতে পারে না।</p>
        <p style="background: #e2e8f0; padding: 12px; border-left: 4px solid #046a38; font-weight: bold; margin: 20px 0;">আজকের পৃথিবীতে সবচেয়ে মূল্যবান সম্পদ শুধু ডিগ্রি নয়—দক্ষতা।</p>
        <div style="text-align: center; margin-top: 40px; font-weight: bold; color: #718096; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 1.1rem;">প্রতিবেদন তৈরি ও প্রকাশনায়: masumcpex</div>
      `
    },
    {
      id: "a2",
      title: "AI যুগে প্রোগ্রামিং শেখার সঠিক পথ",
      category: "Programming",
      date: "২০২৬-০৭-১৮",
      readingTime: "১৬ মিনিট",
      image: "",
      excerpt: "AI কোড লিখে দিচ্ছে ঠিকই — কিন্তু যে বোঝে না কী লেখা হচ্ছে, সে-ই সবচেয়ে বেশি ঝুঁকিতে থাকে। সম্পূর্ণ রোডম্যাপ ও প্রয়োজনীয় স্কিলসহ।",
      url: "article-ai-programming.html",
      content: "<p>AI যুগে প্রোগ্রামিং শেখার জন্য বেসিক লজিক ও প্রম্পট ইঞ্জিনিয়ারিং জানা জরুরি।</p>"
    },
    {
      id: "a3",
      title: "৯৯% মানুষের চেয়ে এগিয়ে যেতে চাইলে যে ৬টি অভ্যাস আজ থেকেই শুরু করা উচিত",
      category: "Productivity",
      date: "২০২৬-০৭-১৯",
      readingTime: "১২ মিনিট",
      image: "",
      excerpt: "প্রতিভা গুরুত্বপূর্ণ, কিন্তু ধারাবাহিকতা তার চেয়েও বেশি গুরুত্বপূর্ণ। ছয়টি বাস্তবসম্মত অভ্যাস, যা আপনার জীবনে সত্যিকারের পার্থক্য তৈরি করতে পারে।",
      url: "article-daily-habits.html",
      content: ""
    },
    {
      id: "a4",
      title: "স্কুল-কলেজে পড়ার সময় যে ১০টি স্কিল শেখা উচিত",
      category: "স্কিল ডেভেলপমেন্ট",
      date: "২০২৬-০৭-১৯",
      readingTime: "১৪ মিনিট",
      image: "",
      excerpt: "ভালো রেজাল্ট আপনাকে একটি চাকরির দরজা পর্যন্ত নিয়ে যেতে পারে, কিন্তু দক্ষতাই আপনাকে জীবনে অনেক দূর এগিয়ে নিয়ে যায় — কমিউনিকেশন থেকে শুরু করে সেলফ ডিসিপ্লিন পর্যন্ত ১০টি জরুরি স্কিল।",
      url: "article-10-skills.html",
      content: "<p>স্কুল-কলেজ জীবনে যে ১০টি স্কিল রপ্ত করা উচিত তার সম্পূর্ণ গাইড।</p>"
    },
    {
      id: "a5",
      title: "র‍্যাট রেস: যে দৌড়ের কোনো ফিনিশ লাইন নেই",
      category: "জীবন ও মানসিকতা",
      date: "২০২৬-০৭-১৯",
      readingTime: "১০ মিনিট",
      image: "",
      excerpt: "সফল হয়েও আমরা কেন সুখী নই? একটি লক্ষ্য পূরণ হলেই কেন সামনে চলে আসে আরেকটি — আর কীভাবে থামা যায় এই না-শেষ-হওয়া দৌড়ে।",
      url: "article-rat-race.html",
      content: ""
    },
    {
      id: "a6",
      title: "Attention Economy: কেন ইনফ্লুয়েন্সারদের যুগে আমরা নিজেদের জীবনকে ব্যর্থ মনে করি?",
      category: "জীবন ও মানসিকতা",
      date: "২০২৬-০৭-১৯",
      readingTime: "২২ মিনিট",
      image: "",
      excerpt: "মনোযোগই আজকের বিশ্বের সবচেয়ে দামি পণ্য। ইনফ্লুয়েন্সার কালচার, অ্যালগরিদম, Dunning-Kruger Effect আর সোশ্যাল কম্পারিজনের গভীর বিশ্লেষণ — গবেষণা ও সোর্স-সহ।",
      url: "article-attention-economy.html",
      content: ""
    },
    {
      id: "a7",
      title: "অসমাপ্ত অনুভূতির ডায়েরি",
      category: "জীবন ও মানসিকতা",
      date: "২০২৬-০৭-১৯",
      readingTime: "৯ মিনিট",
      image: "",
      excerpt: "ভালোবাসা, বন্ধুত্ব, কষ্ট, বিশ্বাস আর জীবনের ছোট ছোট উপলব্ধির একগুচ্ছ ভাঙা টুকরো — কিছু মুহূর্তের ডায়েরি, যা হয়তো আপনারও চেনা লাগবে।",
      url: "journal-unfinished-feelings.html",
      content: ""
    },
    {
      id: "a8",
      title: "Social Media Honey Trap: অনলাইন যৌন প্রতারণা ও ব্ল্যাকমেইলের নেপথ্য কাহিনি",
      category: "সাইবার নিরাপত্তা",
      date: "২০২৬-০৭-১৯",
      readingTime: "১৪ মিনিট",
      image: "",
      excerpt: "Facebook, IMO, Bigo Live-এ ছড়িয়ে থাকা ভুয়া প্রোফাইল, হানি ট্র্যাপ কৌশল, ব্ল্যাকমেইল আর প্রবাসীদের টার্গেট করার পদ্ধতি নিয়ে একটি অনুসন্ধানী প্রতিবেদন — সাথে নিরাপত্তা টিপস ও যাচাইযোগ্য সোর্স।",
      url: "article-honeytrap-scam.html",
      content: ""
    },
    {
      id: "a9",
      title: "বিশ্বমঞ্চে ভারতীয়দের সিইও জয়জয়কার: নেপথ্যের কারণ ও আমাদের শিক্ষাভাবনা",
      category: "Leadership",
      date: "২০২৬-০৭-১৯",
      readingTime: "১২ মিনিট",
      image: "",
      excerpt: "সুন্দর পিচাই, সত্য নাদেলা, অরবিন্দ কৃষ্ণা থেকে শান্তনু নারায়েন — কেন বিশ্বের শীর্ষ কোম্পানিগুলোর CEO পদে ভারতীয়দের এই জয়জয়কার, আর বাংলাদেশ কী শিখতে পারে তা থেকে।",
      url: "article-indian-ceos.html",
      content: ""
    }
  ],

  /* ---------------- Projects ---------------- */
  projects: [
    {
      id: "p0",
      title: "Knowledge Hub",
      icon: "🗂️",
      description: "টিমের দৈনিক হাজিরা ও কাজের ঘণ্টা লিখে রাখার ডিজিটাল খাতা — সদস্য যোগ/বাদ দেওয়া, সামারি ও রেজিস্টারসহ।",
      status: "লাইভ",
      url: "knowledge-hub.html"
    },
    {
      id: "p1",
      title: "Masum Notes",
      icon: "📝",
      description: "ব্যক্তিগত নোট রাখার এবং সাজিয়ে রাখার একটি ছোট্ট টুল।",
      status: "চলছে",
      url: "#"
    },
    {
      id: "p2",
      title: "Work Log",
      icon: "⚡",
      description: "কর্মীদের কাজের দৈনিক ঘণ্টা হিসাব, উপস্থিতি ট্র্যাকিং এবং ফাইল ও লিংক ম্যানেজমেন্টের জন্য তৈরি ডিজিটাল খাতা।",
      status: "লাইভ",
      url: "https://masumcpex.github.io/masumcpex/worklog.html"
    },
    {
      id: "p3",
      title: "Mystery Game",
      icon: "🎮",
      description: "CICADA 3301 ধাঁচের জটিল ধাঁধা ও বুদ্ধিমত্তার খেলা।",
      status: "লাইভ",
      url: "https://docs.google.com/forms/d/e/1FAIpQLSeUXTUT5i4McPtrl27yQj3L3BYl_wGWjVKEDpnMpLnD8Sn3YQ/viewform"
    },
    {
      id: "p4",
      title: "English Learning",
      icon: "🗣️",
      description: "স্মার্ট স্পোকেন ইংলিশ শেখার একটি ইন্টারঅ্যাক্টিভ প্ল্যাটফর্ম।",
      status: "পরিকল্পনায়",
      url: "english-learning.html"
    },
    {
      id: "p5",
      title: "ভবিষ্যতের অ্যাপ",
      icon: "🚀",
      description: "নতুন আইডিয়া নিয়ে কাজ চলছে — শীঘ্রই আসছে।",
      status: "শীঘ্রই",
      url: "#"
    }
  ],

  /* ---------------- Mystery সেকশন ---------------- */
  mystery: {
    title: "⚠️ CICADA 3301 MYSTERY PUZZLE ⚠️",
    notice: "[SYSTEM NOTICE]: একটি অত্যন্ত জটিল ধাঁধা এবং বুদ্ধিমত্তার খেলা আপনার জন্য অপেক্ষা করছে। আপনি কি চ্যালেঞ্জটি নিতে প্রস্তুত?",
    qrImage: "",
    buttonText: "মিশনে প্রবেশ করুন",
    buttonUrl: "https://docs.google.com/forms/d/e/1FAIpQLSeUXTUT5i4McPtrl27yQj3L3BYl_wGWjVKEDpnMpLnD8Sn3YQ/viewform"
  },

  /* ---------------- Contact সেকশন ---------------- */
  contact: {
    phone: "01133192963",
    emails: ["masumcpex@gmail.com", "masumcpex@yahoo.com"],
    socials: [
      { name: "Facebook", url: "https://www.facebook.com/share/1HM1rZJg3a/" },
      { name: "Instagram", url: "https://www.instagram.com/masum.171" },
      { name: "TikTok", url: "https://www.tiktok.com/@masum__171" },
      { name: "Telegram", url: "https://t.me/masum171" },
      { name: "Medium", url: "https://medium.com/@masumcpex" },
      { name: "Tumblr", url: "https://www.tumblr.com/masum171" },
      { name: "Blogger", url: "https://masum171.blogspot.com/" },
      { name: "Gmail", url: "mailto:masumcpex@gmail.com" }
    ]
  }
};
