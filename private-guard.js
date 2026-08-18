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

  if (cipherEl) {
    
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
      
      clearSession();
      redirectHome();
      return;
    }
  }
 
  refreshSession();

  const signOutBtn = signOutBtnId ? document.getElementById(signOutBtnId) : null;
  signOutBtn?.addEventListener("click", () => {
    clearSession();
    redirectHome();
  });

  contentEl.style.display = "";
  if (typeof onReady === "function") onReady();
}
