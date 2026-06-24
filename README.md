[English](#english) | [Bahasa Indonesia](#bahasa-indonesia)

---

<h1 id="english">iMoon07 Portfolio & Blog</h1>

Welcome to the source code of my personal portfolio and blog. This repository contains the frontend implementation built using vanilla HTML, CSS, and JavaScript.

The actual markdown articles are stored in a separate repository: [Penjelajah-CyberSecurity](https://github.com/iMoon07/Penjelajah-CyberSecurity).

## How It Works

This project dynamically fetches markdown files and renders them in the browser.

1. **`data.js`**: Contains the list of articles. Each item includes metadata and a `rawUrl` pointing to a `.md` file on GitHub.
2. **`main.js`**: Reads `data.js` to display the article cards on the homepage.
3. **`read.js`**: When an article is clicked, it fetches the markdown from the `rawUrl` and uses `marked.js` to convert it into HTML for reading.
4. **Giscus (Optional)**: If an article object in `data.js` includes a `giscus` configuration block, the comment section will be enabled for that page.

## Setup Guide

If you would like to use this template for your own portfolio or learning purposes:

1. **Fork this repository** to your GitHub account and rename it to `yourusername.github.io`.
2. **Enable GitHub Pages**: Go to your repository Settings -> Pages -> Deploy from the `main` branch.
3. **Create a Content Repository**: Create a separate repository to store your `.md` files. (Learn Markdown syntax [here](https://www.markdownguide.org/basic-syntax/)).
4. **Update Content**: Open `data.js` in your forked repository and update the `rawUrl` to point to your new markdown files.
5. **Update Profile**: Modify `index.html` and `about.html` with your own profile information and image.

## License
MIT License.

---
<br><br>

<h1 id="bahasa-indonesia">iMoon07 Portfolio & Blog</h1>

Selamat datang di repositori source code untuk personal portfolio dan blog saya. Proyek ini dibangun menggunakan HTML, CSS, dan JavaScript murni (vanilla).

Artikel markdown yang ditampilkan di web ini disimpan pada repositori terpisah: [Penjelajah-CyberSecurity](https://github.com/iMoon07/Penjelajah-CyberSecurity).

## Cara Kerja Sistem

Proyek ini mengambil file markdown secara dinamis dan menampilkannya di browser.

1. **`data.js`**: Berisi daftar artikel. Setiap item memiliki metadata dan `rawUrl` yang mengarah ke file `.md` di GitHub.
2. **`main.js`**: Membaca `data.js` untuk menampilkan daftar artikel di halaman utama.
3. **`read.js`**: Saat artikel diklik, script ini akan mengambil teks markdown dari `rawUrl` dan menggunakan `marked.js` untuk mengubahnya menjadi HTML agar bisa dibaca.
4. **Giscus (Opsional)**: Jika konfigurasi `giscus` ditambahkan pada objek artikel di `data.js`, kolom komentar akan aktif di halaman tersebut.

## Panduan Instalasi

Jika Anda ingin menggunakan template ini untuk portfolio atau sarana belajar:

1. **Fork repositori ini** ke akun GitHub Anda dan ubah namanya menjadi `username.github.io`.
2. **Aktifkan GitHub Pages**: Masuk ke Settings -> Pages -> pilih Deploy dari branch `main`.
3. **Buat Repositori Konten**: Buat repositori terpisah khusus untuk menyimpan file `.md` Anda. (Pelajari Markdown [di sini](https://www.markdownguide.org/basic-syntax/)).
4. **Perbarui Konten**: Buka `data.js` dan ubah link `rawUrl` agar mengarah ke file markdown Anda.
5. **Perbarui Profil**: Edit `index.html` dan `about.html` untuk mengganti informasi profil dan foto Anda.

## Lisensi
MIT License.
