/* ==========================================================================
   contact.js — Contact page interactions (Masum Cpex)
   - Client-side form validation
   - Submit UX (loading state + success/error status, no page reload)
   - Click-to-copy on contact info rows
   ========================================================================== */
(function () {
  'use strict';

  const form = document.getElementById('contactForm');
  if (!form) return; // contact section not on this page

  const submitBtn = document.getElementById('cfSubmit');
  const statusEl = document.getElementById('formStatus');

  const fields = {
    name: { input: document.getElementById('cf-name'), error: document.getElementById('err-name') },
    email: { input: document.getElementById('cf-email'), error: document.getElementById('err-email') },
    subject: { input: document.getElementById('cf-subject'), error: document.getElementById('err-subject') },
    message: { input: document.getElementById('cf-message'), error: document.getElementById('err-message') }
  };

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setError(key, message) {
    const f = fields[key];
    if (!f) return;
    f.error.textContent = message || '';
    f.input.closest('.field').classList.toggle('invalid', !!message);
    f.input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  function validate() {
    let valid = true;

    if (!fields.name.input.value.trim()) {
      setError('name', 'নাম দিন।');
      valid = false;
    } else {
      setError('name', '');
    }

    const emailVal = fields.email.input.value.trim();
    if (!emailVal) {
      setError('email', 'ইমেইল দিন।');
      valid = false;
    } else if (!EMAIL_RE.test(emailVal)) {
      setError('email', 'সঠিক ইমেইল ঠিকানা দিন।');
      valid = false;
    } else {
      setError('email', '');
    }

    if (!fields.subject.input.value.trim()) {
      setError('subject', 'বিষয় লিখুন।');
      valid = false;
    } else {
      setError('subject', '');
    }

    if (!fields.message.input.value.trim()) {
      setError('message', 'বার্তা লিখুন।');
      valid = false;
    } else {
      setError('message', '');
    }

    return valid;
  }

  // clear individual field errors as the user fixes them
  Object.keys(fields).forEach((key) => {
    fields[key].input.addEventListener('input', () => setError(key, ''));
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!validate()) {
      statusEl.textContent = 'অনুগ্রহ করে চিহ্নিত ঘরগুলো ঠিক করুন।';
      statusEl.className = 'form-status err';
      return;
    }

    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    statusEl.textContent = '';
    statusEl.className = 'form-status';

    // NOTE: no backend is wired up yet — replace this block with a real
    // fetch()/EmailJS/Formspree call when the endpoint is ready.
    setTimeout(function () {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
      statusEl.textContent = 'ধন্যবাদ! আপনার বার্তা পাঠানো হয়েছে, শীঘ্রই রিপ্লাই দেব।';
      statusEl.className = 'form-status ok';
      form.reset();
    }, 1100);
  });

  // click-to-copy on left-side contact rows
  document.querySelectorAll('.contact-item[data-copy]').forEach((item) => {
    item.addEventListener('click', function (e) {
      // don't hijack clicks on the actual link/mail/tel anchor
      if (e.target.closest('a')) return;
      const value = item.getAttribute('data-copy');
      if (navigator.clipboard && value) {
        navigator.clipboard.writeText(value).catch(function () {});
      }
    });
  });
})();
