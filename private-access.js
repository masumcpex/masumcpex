export const UNLOCK_KEY = "privateChapterUnlocked";

// PBKDF2-SHA256 parameters — শুধু salt + derived hash + iteration count রাখা
// হয়েছে, আসল password কোথাও নেই।
const PBKDF2_ITERATIONS = 210000;
const PBKDF2_SALT_HEX = "8249cd05db0a1e74d99675fade0b0b87";
const PBKDF2_HASH_HEX = "aee13b6752f90f2b4e9813ed5c7fc5cea64bf7a9ba4609f9ef9351ea1899d429";

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes) {
  return Array.from(new Uint8Array(bytes)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function deriveHex(password, saltHex, iterations, lengthBits) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: hexToBytes(saltHex), iterations, hash: "SHA-256" },
    keyMaterial,
    lengthBits
  );
  return bytesToHex(bits);
}

async function verifyPassword(password) {
  if (!password) return false;
  const derived = await deriveHex(password, PBKDF2_SALT_HEX, PBKDF2_ITERATIONS, PBKDF2_HASH_HEX.length / 2 * 8);
  return derived === PBKDF2_HASH_HEX;
}

/**
 * হোমপেজের #private-chapters সেকশনে ব্যবহার করার জন্য — একমাত্র জায়গা
 * যেখানে password ফর্ম দেখানো হবে।
 */
export function initPrivateGate(opts) {
  const {
    passwordStepId, contentId,
    passwordInputId, passwordSubmitBtnId,
    signOutBtnId, statusId,
    onApproved
  } = opts;

  const passwordStepEl = document.getElementById(passwordStepId);
  const contentEl      = document.getElementById(contentId);
  const statusEl       = document.getElementById(statusId);
  const pwInput         = document.getElementById(passwordInputId);
  const pwSubmitBtn     = document.getElementById(passwordSubmitBtnId);
  const signOutBtn      = document.getElementById(signOutBtnId);

  function setStatus(msg, isError) {
    if (!statusEl) return;
    if (!msg) { statusEl.style.display = "none"; statusEl.textContent = ""; return; }
    statusEl.textContent = msg;
    statusEl.style.display = "block";
    statusEl.classList.toggle("private-gate-error", !!isError);
    statusEl.classList.toggle("private-gate-ok", !isError);
  }

  function showStep(step) { // "password" | "content"
    if (passwordStepEl) passwordStepEl.style.display = step === "password" ? "" : "none";
    if (contentEl)       contentEl.style.display       = step === "content" ? "" : "none";
  }

  async function tryUnlock() {
    setStatus("");
    const val = (pwInput?.value || "").trim();
    if (!val) { setStatus(" Password লিখুন।", true); return; }
    if (pwSubmitBtn) pwSubmitBtn.disabled = true;
    try {
      const ok = await verifyPassword(val);
      if (ok) {
        localStorage.setItem(UNLOCK_KEY, "1");
        if (pwInput) pwInput.value = "";
        setStatus("");
        showStep("content");
        if (typeof onApproved === "function") onApproved();
      } else {
        setStatus(" Password সঠিক নয়। আবার চেষ্টা করুন।", true);
      }
    } finally {
      if (pwSubmitBtn) pwSubmitBtn.disabled = false;
    }
  }

  pwSubmitBtn?.addEventListener("click", tryUnlock);

  pwInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); tryUnlock(); }
  });

  signOutBtn?.addEventListener("click", () => {
    localStorage.removeItem(UNLOCK_KEY);
    showStep("password");
    setStatus("");
  });

  // আগে থেকে আনলক করা থাকলে সরাসরি content দেখাও।
  if (localStorage.getItem(UNLOCK_KEY) === "1") {
    showStep("content");
    if (typeof onApproved === "function") onApproved();
  } else {
    showStep("password");
  }
}
