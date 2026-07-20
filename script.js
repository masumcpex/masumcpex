/* ==========================================================================
   script.js — data.js এর কনটেন্ট দিয়ে পুরো সাইট রেন্ডার করে।
   নতুন সেকশন যোগ করতে চাইলে data.js এডিট করুন, এই ফাইলে হাত দেওয়ার দরকার নেই।
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {

  /* ---------------- HERO ---------------- */
  const hero = SITE_DATA.hero;
  document.getElementById("heroPhoto").src = hero.photo;
  document.getElementById("heroName").textContent = hero.name;
  document.getElementById("heroRole").textContent = hero.role;
  document.getElementById("heroTagline").textContent = hero.tagline;
  const heroCta = document.getElementById("heroCta");
  heroCta.textContent = hero.ctaText;
  heroCta.href = hero.ctaLink;

  /* ---------------- ABOUT ---------------- */
  const about = SITE_DATA.about;
  document.getElementById("aboutTitle").textContent = about.title;
  document.getElementById("aboutPhoto").src = about.photo;
  document.getElementById("aboutText").innerHTML = about.paragraphs.map(p => `<p>${p}</p>`).join("");
  document.getElementById("aboutStats").innerHTML = about.stats.map(s =>
    `<div class="stat"><span class="num">${s.number}</span><span class="lbl">${s.label}</span></div>`
  ).join("");

  /* ---------------- LIBRARY ---------------- */
  function bookCard(b){
    return `
    <div class="book-card ${b.locked ? "locked":""}">
      <img class="book-cover" src="${b.cover}" alt="${b.title}">
      <div class="book-body">
        <span class="book-cat">${b.category}</span>
        <h3 class="book-title">${b.title}</h3>
        <p class="book-desc">${b.description}</p>
        <div class="book-meta"><span>⏱ ${b.readingTime}</span></div>
        <div class="book-actions">
          ${b.locked
            ? `<a href="#">🔒 অনুমতি প্রয়োজন</a>`
            : `<a class="solid" href="${b.readMoreUrl}" target="_blank" rel="noopener">Read More</a>
               <a href="${b.downloadUrl}" target="_blank" rel="noopener">Download</a>`
          }
        </div>
      </div>
    </div>`;
  }
  document.getElementById("bookGrid").innerHTML = SITE_DATA.books.map(bookCard).join("");

  /* ---------------- PROJECTS ---------------- */
  function projectCard(p){
    return `
    <div class="book-card">
      <div class="project-icon">${p.icon}</div>
      <div class="book-body">
        <h3 class="book-title">${p.title}</h3>
        <p class="book-desc">${p.description}</p>
        <span class="project-status">${p.status}</span>
        <div class="book-actions" style="margin-top:.9rem;">
          <a class="solid" href="${p.url}" target="_blank" rel="noopener">দেখুন</a>
        </div>
      </div>
    </div>`;
  }
  document.getElementById("projectGrid").innerHTML = SITE_DATA.projects.map(projectCard).join("");

  /* ---------------- JOURNAL & ARTICLES (with filters + modal) ---------------- */
  function entryCard(e){
    return `
    <div class="entry-card" data-id="${e.id}" data-type="${e._type}" data-url="${e.url || ""}">
      <span class="cat">${e.category}</span>
      <h4>${e.title}</h4>
      <p class="excerpt">${e.excerpt}</p>
      <span class="date">${e.date}${e.readingTime ? " • ⏱ " + e.readingTime : ""}</span>
    </div>`;
  }

  SITE_DATA.journal.forEach(j => j._type = "journal");
  SITE_DATA.articles.forEach(a => a._type = "article");

  function renderJournal(filter){
    const list = filter && filter !== "সব" ? SITE_DATA.journal.filter(j => j.category === filter) : SITE_DATA.journal;
    document.getElementById("journalList").innerHTML = list.map(entryCard).join("") || `<p class="section-sub">এই ক্যাটাগরিতে এখনো কিছু লেখা হয়নি।</p>`;
  }
  function renderArticles(filter){
    const list = filter && filter !== "সব" ? SITE_DATA.articles.filter(a => a.category === filter) : SITE_DATA.articles;
    document.getElementById("articleList").innerHTML = list.map(entryCard).join("") || `<p class="section-sub">এই ক্যাটাগরিতে এখনো কিছু লেখা হয়নি।</p>`;
  }

  document.getElementById("journalFilters").innerHTML = SITE_DATA.journalCategories.map((c,i) =>
    `<button class="chip ${i===0?"active":""}" data-cat="${c}">${c}</button>`).join("");
  document.getElementById("articleFilters").innerHTML = SITE_DATA.articleCategories.map((c,i) =>
    `<button class="chip ${i===0?"active":""}" data-cat="${c}">${c}</button>`).join("");

  document.getElementById("journalFilters").addEventListener("click", e => {
    if(!e.target.matches(".chip")) return;
    [...e.target.parentElement.children].forEach(c => c.classList.remove("active"));
    e.target.classList.add("active");
    renderJournal(e.target.dataset.cat);
  });
  document.getElementById("articleFilters").addEventListener("click", e => {
    if(!e.target.matches(".chip")) return;
    [...e.target.parentElement.children].forEach(c => c.classList.remove("active"));
    e.target.classList.add("active");
    renderArticles(e.target.dataset.cat);
  });

  renderJournal("সব");
  renderArticles("সব");

  /* click on an entry card opens the read modal, or navigates if a real url is set */
  function findEntry(id, type){
    return (type === "journal" ? SITE_DATA.journal : SITE_DATA.articles).find(e => e.id === id);
  }
  function openModal(entry){
    document.getElementById("modalCategory").textContent = entry.category;
    document.getElementById("modalTitle").textContent = entry.title;
    document.getElementById("modalDate").textContent = entry.date;
    document.getElementById("modalContent").innerHTML = entry.content;
    document.getElementById("readModal").classList.add("open");
  }
  document.body.addEventListener("click", e => {
    const card = e.target.closest(".entry-card");
    if(!card) return;
    const url = card.dataset.url;
    if(url && url !== "#"){ window.location.href = url; return; }
    openModal(findEntry(card.dataset.id, card.dataset.type));
  });
  document.getElementById("modalClose").addEventListener("click", () => {
    document.getElementById("readModal").classList.remove("open");
  });
  document.getElementById("readModal").addEventListener("click", e => {
    if(e.target.id === "readModal") e.target.classList.remove("open");
  });

  /* ---------------- MYSTERY ---------------- */
  const mystery = SITE_DATA.mystery;
  document.getElementById("mysteryTitle").textContent = mystery.title;
  document.getElementById("mysteryNotice").textContent = mystery.notice;
  const mBtn = document.getElementById("mysteryBtn");
  mBtn.textContent = mystery.buttonText;
  mBtn.href = mystery.buttonUrl;

  /* ---------------- CONTACT ---------------- */
  const contact = SITE_DATA.contact;
  document.getElementById("contactPhone").textContent = "📞 মোবাইল নম্বর: " + contact.phone;
  document.getElementById("contactEmails").textContent = "📧 " + contact.emails.join(" | ");
  document.getElementById("socialRow").innerHTML = contact.socials.map(s =>
    `<a href="${s.url}" target="_blank" rel="noopener">${s.name}</a>`).join("");

  /* ---------------- HOME HIGHLIGHTS ---------------- */
  function highlightCard(tag, title, desc, linkText, onClickHash){
    return `
    <div class="highlight-card">
      <span class="tag">${tag}</span>
      <h4>${title}</h4>
      <p>${desc}</p>
      <a href="${onClickHash}">${linkText} →</a>
    </div>`;
  }
  const latestBook = SITE_DATA.books.filter(b => !b.locked)[0];
  const latestJournal = SITE_DATA.journal[0];
  const latestArticle = SITE_DATA.articles[0];
  const featuredProject = SITE_DATA.projects.find(p => p.status === "লাইভ") || SITE_DATA.projects[0];

  document.getElementById("homeHighlights").innerHTML = [
    highlightCard("Latest Book", latestBook.title, latestBook.description, "লাইব্রেরিতে দেখুন", "#library"),
    highlightCard("Latest Journal", latestJournal.title, latestJournal.excerpt, "পড়ুন", "#journal"),
    highlightCard("Latest Article", latestArticle.title, latestArticle.excerpt, "পড়ুন", "#articles"),
    highlightCard("Featured Project", featuredProject.title, featuredProject.description, "দেখুন", "#projects")
  ].join("");

  /* ---------------- ROUTING / NAV ---------------- */
  const pages = document.querySelectorAll(".page");
  const navLinks = document.querySelectorAll(".main-nav a");

  function showPage(id){
    if(!document.getElementById(id)) id = "home";
    pages.forEach(p => p.classList.toggle("active", p.id === id));
    navLinks.forEach(l => l.classList.toggle("active", l.dataset.nav === id));
    document.getElementById("mainNav").classList.remove("open");
    window.scrollTo({top:0, behavior:"instant" in window ? "instant" : "auto"});
  }
  window.addEventListener("hashchange", () => showPage(location.hash.replace("#","") || "home"));
  showPage(location.hash.replace("#","") || "home");

  /* ---------------- MOBILE MENU ---------------- */
  document.getElementById("menuToggle").addEventListener("click", () => {
    document.getElementById("mainNav").classList.toggle("open");
  });

  /* ---------------- SEARCH ---------------- */
  const searchPanel = document.getElementById("searchPanel");
  document.getElementById("searchToggle").addEventListener("click", () => {
    searchPanel.classList.toggle("open");
    if(searchPanel.classList.contains("open")) document.getElementById("searchInput").focus();
  });
  document.getElementById("searchClose").addEventListener("click", () => {
    searchPanel.classList.remove("open");
  });

  function buildSearchIndex(){
    const idx = [];
    SITE_DATA.books.forEach(b => idx.push({type:"Books", title:b.title, desc:b.description, hash:"#library"}));
    SITE_DATA.journal.forEach(j => idx.push({type:"Journal", title:j.title, desc:j.excerpt, hash:"#journal"}));
    SITE_DATA.articles.forEach(a => idx.push({type:"Articles", title:a.title, desc:a.excerpt, hash:"#articles"}));
    SITE_DATA.projects.forEach(p => idx.push({type:"Projects", title:p.title, desc:p.description, hash:"#projects"}));
    return idx;
  }
  const searchIndex = buildSearchIndex();

  document.getElementById("searchInput").addEventListener("input", e => {
    const q = e.target.value.trim().toLowerCase();
    const resultsEl = document.getElementById("searchResults");
    if(!q){ resultsEl.innerHTML = ""; return; }
    const matches = searchIndex.filter(item =>
      item.title.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q)
    ).slice(0, 12);
    resultsEl.innerHTML = matches.length
      ? matches.map(m => `<div class="search-result-item" data-hash="${m.hash}"><small>${m.type}</small>${m.title}</div>`).join("")
      : `<div class="search-result-item">কোনো ফলাফল পাওয়া যায়নি।</div>`;
  });

  document.getElementById("searchResults").addEventListener("click", e => {
    const item = e.target.closest(".search-result-item");
    if(item && item.dataset.hash){
      location.hash = item.dataset.hash;
      searchPanel.classList.remove("open");
    }
  });

});
