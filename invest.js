/* ==========================================================================
   invest.js — BlackRock ও Vanguard আর্টিকেল পেজ ইন্টারঅ্যাকশন
   ========================================================================== */
(function(){
  "use strict";

  var doc = document;

  /* ---------- Dark mode ---------- */
  var THEME_KEY = "invest-theme";
  var themeBtn = doc.getElementById("themeToggle");
  function applyTheme(t){
    doc.documentElement.setAttribute("data-theme", t);
    if(themeBtn) themeBtn.textContent = t === "dark" ? "☀️" : "🌙";
  }
  (function initTheme(){
    var saved = null;
    try{ saved = localStorage.getItem(THEME_KEY); }catch(e){}
    if(saved){ applyTheme(saved); }
    else{
      var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      applyTheme(prefersDark ? "dark" : "light");
    }
  })();
  if(themeBtn){
    themeBtn.addEventListener("click", function(){
      var cur = doc.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
      var next = cur === "dark" ? "light" : "dark";
      applyTheme(next);
      try{ localStorage.setItem(THEME_KEY, next); }catch(e){}
    });
  }

  /* ---------- Reading progress bar ---------- */
  var progressBar = doc.getElementById("progressBar");
  function updateProgress(){
    var scrollTop = window.scrollY || doc.documentElement.scrollTop;
    var docHeight = doc.documentElement.scrollHeight - window.innerHeight;
    var pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    if(progressBar) progressBar.style.width = Math.min(100, Math.max(0, pct)) + "%";
  }

  /* ---------- Back to top ---------- */
  var backTop = doc.getElementById("backTop");
  function updateBackTop(){
    if(!backTop) return;
    if(window.scrollY > 600) backTop.classList.add("show");
    else backTop.classList.remove("show");
  }
  if(backTop){
    backTop.addEventListener("click", function(){
      window.scrollTo({top:0, behavior:"smooth"});
    });
  }

  /* ---------- Copy link ---------- */
  var copyBtn = doc.getElementById("copyLinkBtn");
  var toast = doc.getElementById("toast");
  function showToast(msg){
    if(!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function(){ toast.classList.remove("show"); }, 2200);
  }
  if(copyBtn){
    copyBtn.addEventListener("click", function(){
      var url = window.location.href;
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(url).then(function(){
          showToast("✓ লিংক কপি হয়েছে");
        }).catch(function(){ fallbackCopy(url); });
      } else {
        fallbackCopy(url);
      }
    });
  }
  function fallbackCopy(text){
    var ta = doc.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    doc.body.appendChild(ta);
    ta.select();
    try{ doc.execCommand("copy"); showToast("✓ লিংক কপি হয়েছে"); }
    catch(e){ showToast("কপি করা যায়নি"); }
    doc.body.removeChild(ta);
  }

  /* ---------- Sticky TOC active-section highlight ---------- */
  var sections = Array.prototype.slice.call(doc.querySelectorAll(".section[id]"));
  var tocLinks = Array.prototype.slice.call(doc.querySelectorAll(".toc-desktop a, .toc-mobile a"));

  function setActiveLink(id){
    tocLinks.forEach(function(a){
      var match = a.getAttribute("href") === "#" + id;
      a.classList.toggle("active", match);
    });
  }

  var observer = null;
  if("IntersectionObserver" in window && sections.length){
    observer = new IntersectionObserver(function(entries){
      var visible = entries.filter(function(en){ return en.isIntersecting; });
      if(visible.length){
        visible.sort(function(a,b){ return a.boundingClientRect.top - b.boundingClientRect.top; });
        setActiveLink(visible[0].target.id);
      }
    }, { rootMargin: "-15% 0px -70% 0px", threshold: [0, 1] });
    sections.forEach(function(s){ observer.observe(s); });
  }

  /* Smooth-scroll for TOC + close mobile <details> after click */
  tocLinks.forEach(function(a){
    a.addEventListener("click", function(){
      var mobileToc = a.closest(".toc-mobile");
      if(mobileToc) mobileToc.removeAttribute("open");
    });
  });

  /* ---------- Scroll listeners (throttled via rAF) ---------- */
  var ticking = false;
  function onScroll(){
    if(!ticking){
      window.requestAnimationFrame(function(){
        updateProgress();
        updateBackTop();
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener("scroll", onScroll, { passive:true });
  updateProgress();
  updateBackTop();

})();
