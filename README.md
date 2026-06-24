[🇬🇧 English](#english) | [🇮🇩 Bahasa Indonesia](#bahasa-indonesia)

---

<h1 id="english">🇬🇧 iMoon07 Portfolio & Blog Engine 🚀</h1>

Welcome to the frontend engine of my personal cybersecurity portfolio! This is not your average WordPress site. This is a **Decoupled Headless CMS built on pure GitOps** (HTML/CSS/JS). 

> **Wait, where are the articles?**
> The actual articles (Markdown files) are NOT stored here! They live in a separate "Database" repository: [Penjelajah-CyberSecurity](https://github.com/iMoon07/Penjelajah-CyberSecurity). This repo is strictly the "UI/UX Engine" that fetches and renders them.

## 🛠️ Want to Fork & Build Your Own? (Guide for Tinkerers)

If you're a fellow engineer/hacker who likes to tinker and hates paying for hosting, you can steal this architecture! 

**Disclaimer:** The workflow is a bit manual and might feel slightly complicated for absolute beginners, but hey, that's where the fun is, right? xD

### Step-by-Step Setup:
1. **Fork This Repo:** Rename it to `yourusername.github.io`.
2. **Create a "Database" Repo:** Create a second, separate repository exclusively to store your `.md` files.
3. **Activate GitHub Pages:** Go to your repository **Settings > Pages**. Under "Build and deployment", set the Source to "Deploy from a branch", select your `main` branch, and click Save. Wait a few minutes, and your portfolio will be live at `https://yourusername.github.io/`!
4. **The Brain (`data.js`):** Open `data.js` in this repo. You need to add your articles here manually. Change the `rawUrl` to point to the **Raw GitHub Content** link of the `.md` file from your second repo.
5. **Customize Your Face:** Replace `foto-raja.jpg` and edit `index.html` & `about.html` to put your own face and bio.
6. **Setup Comments (Giscus):** Go to [giscus.app](https://giscus.app), connect your GitHub, get your own `repoId` and `categoryId`, then paste them into your `data.js`.

## Architecture & Core Features
- **Zero Backend / Serverless:** Pure Vanilla JS. Blazing fast and immune to SQL Injection.
- **Dynamic Markdown Rendering:** Uses Marked.js to translate raw `.md` files into HTML on-the-fly.
- **Bilingual & Slug Routing:** Clean URLs like `?post=my-article&lang=en`.
- **Social Media Ready:** Hardcoded Open Graph meta tags to force large banner unfurling on LinkedIn/Discord.

## License
MIT License. Do whatever you want, just don't hack me! 🍻

---

<br><br>

<h1 id="bahasa-indonesia">🇮🇩 iMoon07 Portfolio & Mesin Blog 🚀</h1>

Selamat datang di *frontend engine* dari web portfolio Cyber Security gue! Jangan salah, ini bukan web WordPress biasa. Ini adalah **Decoupled Headless CMS berbasis murni GitOps** (Cuma pakai HTML/CSS/JS Vanilla).

> **Loh, artikel-artikelnya pada di mana?**
> File artikel aslinya (Markdown/.md) NGGAK DISIMPAN di sini! Datanya disimpen di repositori "Database" terpisah: [Penjelajah-CyberSecurity](https://github.com/iMoon07/Penjelajah-CyberSecurity). Repositori ini tugasnya cuma jadi "Mesin UI/UX" yang nyedot dan nampilin artikelnya.

## 🛠️ Mau Fork & Bikin Kayak Gini Juga? (Panduan Buat Kang Ngoprek)

Buat lu sesama *Engineer/Hacker* yang hobi ngoprek dan males bayar *hosting*, lu boleh banget nyolong arsitektur web ini! 

**Disclaimer:** Cara kerjanya agak manual dan mungkin lumayan ribet buat pemula yang terbiasa terima jadi, tapi justru di situ serunya kan? xD

### Step-by-Step Setup:
1. **Fork Repositori Ini:** Ganti namanya jadi `username-lu.github.io`.
2. **Bikin Repositori "Database":** Bikin satu repositori terpisah lagi khusus buat nyimpen file-file tulisan `.md` lu.
3. **Aktifin GitHub Pages:** Masuk ke **Settings > Pages** di repo ini. Di bagian "Build and deployment", pilih Source ke "Deploy from a branch", arahin ke *branch* `main`, terus Save. Tunggu beberapa menit, dan web lu bakal *live* di `https://username-lu.github.io/`!
4. **Setting Otaknya (`data.js`):** Buka file `data.js` di repo ini. Lu harus nambahin daftar artikel lu secara manual di sini. Ganti `rawUrl`-nya supaya ngarah ke link **Raw GitHub Content** dari file `.md` yang ada di repo kedua lu.
5. **Ganti Muka:** Hapus `foto-raja.jpg`, terus edit file `index.html` & `about.html` buat masukin muka lu sendiri beserta bio-nya.
6. **Pasang Fitur Komentar (Giscus):** Buka [giscus.app](https://giscus.app), koneksikan ke GitHub lu. Nanti lu dapet `repoId` sama `categoryId`, nah tinggal *paste* ID itu ke dalem `data.js`.

## Arsitektur & Fitur Utama
- **Zero Backend / Serverless:** Murni Vanilla JS. Super kenceng dan 100% kebal dari SQL Injection.
- **Dynamic Markdown Rendering:** Pakai Marked.js buat nerjemahin file `.md` mentah jadi desain HTML estetik secara *real-time*.
- **Bilingual & Slug Routing:** URL-nya rapi dan profesional kayak `?post=nama-artikel&lang=en`.
- **Social Media Ready:** Udah gue pasang *Open Graph meta tags* supaya *Banner* raksasa lu otomatis muncul di Sosmed.

## Lisensi
Projek ini berlisensi MIT. Intinya bebas ngapain aja, asal jangan nge-hack gue! 🍻
