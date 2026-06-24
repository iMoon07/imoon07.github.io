[English](#english) | [Bahasa Indonesia](#bahasa-indonesia)

---

<h1 id="english">iMoon07 Portfolio & Blog Engine</h1>

A decoupled, purely static, headless CMS architecture built with vanilla HTML, CSS, and JS. 

This repository acts strictly as the Frontend Engine. The actual Markdown articles are stored in a separate database repository: [Penjelajah-CyberSecurity](https://github.com/iMoon07/Penjelajah-CyberSecurity).

## Internal Wiring (How The Code Connects)

To understand this engine, you must understand how the "cables" connect inside the code. 

### 1. The Database Registry (`data.js`)
This is the single source of truth. It contains an array called `myProjects`.
- **If you want to ADD a new article:** You add a new JSON object inside the `myProjects` array here.
- **If you want to CHANGE the Giscus comment repo:** You change the `repo`, `repoId`, and `categoryId` values here.
- **If you want to TURN ON/OFF Comments per article (Optional, Moderate Complexity):** The code supports individual comment toggling. To turn it **ON**, include the `giscus` JSON block inside the article's object in `data.js`. To turn it **OFF**, simply delete or omit the `giscus` block.

### 2. The Main Page (`index.html` & `main.js`)
`index.html` builds the shell. `main.js` loops through `data.js` and injects HTML cards into the DOM.
- **If you want to CHANGE your profile picture, name, or bio:** You edit `index.html` and `about.html` directly.
- **If you want to CHANGE the design of the article cards:** You edit the `renderProjects()` function inside `main.js`.
- The "cable": `main.js` generates clickable links formatted as `read.html?post=[ID]&lang=[LANG]`.

### 3. The Markdown Fetcher (`read.html` & `read.js`)
When a user clicks a card, they are sent to `read.html`. This page is completely empty. `read.js` does the heavy lifting:
1. It reads the `?post=` and `?lang=` parameters from the URL.
2. It searches `data.js` for the exact `id`.
3. It takes the `rawUrl` and executes `fetch(rawUrl)`. Note: It dynamically modifies the URL to fetch either `-en.md` or `-id.md` based on the language state.
4. It passes the raw markdown string into `marked.parse()`.
5. It injects the resulting HTML into `<div id="content">`.
- **How Giscus On/Off Works:** If the `giscus` block exists in `data.js`, `read.js` dynamically creates a `<script>` tag with the Giscus attributes and injects it into the DOM. If the block is missing, the script is skipped, and comments are disabled.
- **If you want to CHANGE how Markdown is parsed or styled:** You modify `read.js`.

## Setup Guide
1. **Fork this repository** and rename it to `yourusername.github.io`.
2. **Create a Content Repository** to store your `.md` files. (Note: You must author and write the Markdown articles yourself manually. New to Markdown? [Learn the syntax here](https://www.markdownguide.org/basic-syntax/)).
3. **Configure GitHub Pages** in your repo Settings -> Pages -> Deploy from `main` branch.
4. **Update `data.js`:** Add your articles here. The `rawUrl` must point to `https://raw.githubusercontent.com/...` of your Markdown files.
5. **Update Identity:** Replace `foto-raja.jpg` and modify the hardcoded bio in `index.html` and `about.html`.
6. **Setup Giscus:** Go to giscus.app to generate your `repoId` and `categoryId`, then map them in `data.js`.

## License
MIT License.

---
<br><br>

<h1 id="bahasa-indonesia">iMoon07 Portfolio & Mesin Blog</h1>

Sebuah arsitektur decoupled headless CMS statis yang dibangun murni pakai HTML, CSS, dan JS Vanilla.

Repositori ini murni berfungsi sebagai Mesin Frontend. Artikel Markdown aslinya disimpan di repositori database terpisah: [Penjelajah-CyberSecurity](https://github.com/iMoon07/Penjelajah-CyberSecurity).

## Alur Kabel Internal (Cara Kerja Kodenya)

Biar lu nggak pusing pas ngoprek, ini peta "kabel" yang ngehubungin semua file di sistem ini:

### 1. Registri Database (`data.js`)
Ini adalah otak utamanya. Berisi array bernama `myProjects`.
- **Kalau lu mau NAMBAH artikel baru:** Lu tambahin objek JSON baru ke dalam array `myProjects` di sini.
- **Kalau lu mau GANTI settingan komentar Giscus:** Lu ganti value `repo`, `repoId`, dan `categoryId` di file ini.
- **Kalau lu mau ON/OFF Komentar Giscus per artikel (Opsional, Tingkat Keribetan Lumayan):** Sistem ini dukung komentar yang bisa dinyalain/dimatiin buat tiap artikel. Kalau mau **ON**, lu wajib masukin blok kode `giscus` (`repo`, `repoId`, dll) di dalam objek artikel tersebut di `data.js`. Kalau mau **OFF**, lu cukup hapus atau jangan masukin blok `giscus`-nya.

### 2. Halaman Utama (`index.html` & `main.js`)
`index.html` bikin kerangkanya. `main.js` ngebaca `data.js` lalu nyetak kotak-kotak (cards) artikel ke layar.
- **Kalau lu mau GANTI foto profil, nama, atau bio:** Lu ubah langsung di dalam file `index.html` dan `about.html`.
- **Kalau lu mau GANTI desain kotak artikel (Card UI):** Lu ubah kode HTML di dalam fungsi `renderProjects()` yang ada di `main.js`.
- Kabel penghubungnya: `main.js` bakal nge-generate link buat tiap artikel dengan format `read.html?post=[ID]&lang=[LANG]`.

### 3. Mesin Fetching Markdown (`read.html` & `read.js`)
Pas lu klik salah satu artikel, lu bakal dilempar ke `read.html`. Halaman ini aslinya KOSONG MELOMPONG. File `read.js` yang kerja keras:
1. Dia ngebaca parameter `?post=` dan `?lang=` dari URL atas.
2. Dia nyari data artikel yang cocok di dalam `data.js`.
3. Dia ngambil `rawUrl` dan ngejalani fungsi `fetch(rawUrl)`. Script ini pinter, dia bakal otomatis nyari akhiran `-en.md` atau `-id.md` tergantung bahasa yang dipilih.
4. Teks Markdown mentah yang berhasil didownload bakal dilempar ke library `marked.parse()`.
5. Hasil akhirnya (HTML) disuntik paksa masuk ke dalam `<div id="content">`.
- **Cara Kerja On/Off Giscus:** Kalau blok `giscus` terdeteksi di `data.js`, `read.js` bakal ngerakit tag `<script>` secara dinamis lalu nyuntikinnya ke halaman. Kalau bloknya dihapus/nggak ada, kode bakal di-skip dan kolom komentar otomatis mati.
- **Kalau lu mau GANTI cara render Markdown atau nambah fitur syntax highlighting:** Lu modifikasi file `read.js` ini.

## Panduan Setup (Buat Kang Ngoprek)

Setup-nya emang sedikit manual dan agak ribet, tapi disitulah seninya kan xD.

1. **Fork repositori ini** dan ubah namanya jadi `username-lu.github.io`.
2. **Bikin Repositori Konten** terpisah buat nyimpen file `.md` lu. (Catatan: Lu tetep harus mikir dan ngetik tulisan Markdown lu sendiri secara manual. Belum bisa Markdown? [Pelajari sintaksnya di sini](https://www.markdownguide.org/basic-syntax/)).
3. **Aktifkan GitHub Pages** di Settings -> Pages -> Deploy dari branch `main`.
4. **Edit `data.js`:** Tambahin list artikel lu di sini. Pastikan `rawUrl` ngarah ke link `https://raw.githubusercontent.com/...` dari file Markdown lu.
5. **Ganti Identitas:** Hapus `foto-raja.jpg` dan edit bio di `index.html` sama `about.html`.
6. **Pasang Giscus:** Buka giscus.app buat dapetin `repoId` dan `categoryId` lu, terus masukin ke `data.js`.

## Lisensi
MIT License.
