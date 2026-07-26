# Facebook Login ঠিক করার চেকলিস্ট

নিচে যেখানে যা বসাতে হবে তা কপি করে বসিয়ে দিন। প্রতিটা ধাপ শেষে **Save Changes** চাপতে ভুলবেন না।

---

## ধাপ ১: App Domains (Settings → Basic)

Chrome-এ যান: **developers.facebook.com** → আপনার অ্যাপে ঢুকুন → বাম মেনুতে **Settings → Basic**

"App domains" বক্সে একটার পর একটা লিখে Enter চাপুন (দুইটা লাইন):

```
masumcpex.github.io
```
```
masumcpex-f65cf.firebaseapp.com
```

তারপর নিচে/উপরে **Save Changes** চাপুন।

---

## ধাপ ২: Valid OAuth Redirect URI (Facebook Login → Settings)

একই অ্যাপের বাম মেনুতে **Facebook Login → Settings**-এ যান।

"Valid OAuth Redirect URIs" বক্সে বসান:

```
https://masumcpex-f65cf.firebaseapp.com/__/auth/handler
```

নিশ্চিত করুন এগুলো **চালু (Yes/On)** আছে:
- Client OAuth Login
- Web OAuth Login

তারপর **Save Changes** চাপুন।

---

## ধাপ ৩: Firebase Console (আগেই ঠিক করা আছে, শুধু মিলিয়ে দেখুন)

**console.firebase.google.com** → প্রজেক্ট **masumcpex-f65cf** → **Authentication → Settings → Authorized domains**

এখানে থাকতে হবে (আগেই যোগ করা আছে, যদি না থাকে তাহলে Add domain দিয়ে যোগ করুন):

```
masumcpex.github.io
```

---

## সব শেষে

দুই ধাপ Save করার পর সাইটে ফিরে গিয়ে **Facebook বাটনে** আবার ক্লিক করে দেখুন।
