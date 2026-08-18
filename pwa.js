
(function () {
  "use strict";

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/service-worker.js").catch((err) => {
        console.warn("[PWA] Service worker রেজিস্ট্রেশন ব্যর্থ:", err);
      });
    });
  }

  function isStandalone() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true /* iOS Safari */
    );
  }

  if (isStandalone()) return; /* অ্যাপ হিসেবে খোলা থাকলে বাটন দরকার নেই */

  const DISMISS_KEY = "masumcpex_install_dismissed_at";
  const DISMISS_DAYS = 14;

  function wasRecentlyDismissed() {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const diffDays = (Date.now() - Number(raw)) / (1000 * 60 * 60 * 24);
    return diffDays < DISMISS_DAYS;
  }

  let deferredPrompt = null;
  let installBtn = null;

  function createInstallButton() {
    if (document.getElementById("pwaInstallBtn")) return;

    const style = document.createElement("style");
    style.textContent = `
      #pwaInstallBtn{
        position:fixed; right:18px; bottom:18px; z-index:9999;
        display:flex; align-items:center; gap:8px;
        background:linear-gradient(135deg,#0E6E5C,#0A5347);
        color:#F8FAFC; border:none; border-radius:999px;
        padding:12px 18px; font-family:'Hind Siliguri','Inter',sans-serif;
        font-size:14px; font-weight:600; cursor:pointer;
        box-shadow:0 10px 30px rgba(16,24,40,0.25);
        transition:transform .2s ease, opacity .2s ease;
        opacity:0; transform:translateY(12px);
      }
      #pwaInstallBtn.show{ opacity:1; transform:translateY(0); }
      #pwaInstallBtn:active{ transform:scale(0.96); }
      #pwaInstallBtn .pwa-close{
        margin-left:2px; opacity:0.75; font-size:13px; padding:2px 4px;
      }
      @media (max-width:480px){
        #pwaInstallBtn{ right:14px; bottom:14px; padding:11px 16px; font-size:13px; }
      }
    `;
    document.head.appendChild(style);

    installBtn = document.createElement("button");
    installBtn.id = "pwaInstallBtn";
    installBtn.setAttribute("aria-label", "Install App");
    installBtn.innerHTML = `📱 <span>Install App</span> <span class="pwa-close" id="pwaInstallClose" aria-label="বন্ধ করুন">✕</span>`;
    document.body.appendChild(installBtn);

    requestAnimationFrame(() => installBtn.classList.add("show"));

    installBtn.addEventListener("click", async (e) => {
      if (e.target && e.target.id === "pwaInstallClose") {
        e.stopPropagation();
        dismiss();
        return;
      }
      if (!deferredPrompt) return;
      installBtn.disabled = true;
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice.catch(() => null);
      deferredPrompt = null;
      removeButton();
      if (!choice || choice.outcome !== "accepted") {
        
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
      }
    });
  }

  function removeButton() {
    if (installBtn && installBtn.parentNode) installBtn.parentNode.removeChild(installBtn);
    installBtn = null;
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    removeButton();
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    if (!wasRecentlyDismissed()) {
      createInstallButton();
    }
  });

  window.addEventListener("appinstalled", () => {
    removeButton();
    localStorage.removeItem(DISMISS_KEY);
  });
})();
