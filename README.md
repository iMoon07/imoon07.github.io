# imoon07.github.io

Source code for the personal website and portfolio of **Raja Muhammad Kurnia Setyawan (@iMoon07)** — security, penetration testing, and technical writing.

- **Live site:** https://imoon07.github.io/
- **Content repo (articles & references, Markdown):** https://github.com/iMoon07/Penjelajah-CyberSecurity
- **Logo assets (digital rain):** https://github.com/iMoon07/logo-svg

> Built portofolio to success.

---

## Ringkasan teknis

Situs ini adalah **static site** (HTML + CSS + JS murni, tanpa build step/framework). Konten artikel dan referensi **tidak disimpan di repo ini** sebagai file markdown statis, melainkan diambil (fetch) saat runtime dari repository konten terpisah melalui URL raw GitHub.

## Font & tipografi

Tipografi disatukan agar nyaman dibaca (UI/portofolio, blog, dan artikel teknis):

| Peran | Stack / sumber | Dipakai di |
|---|---|---|
| **Body/UI utama** | `"Inter", "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, "Noto Naskh Arabic", "Amiri", sans-serif` | Shell/nav, Home/About, Blog, Read/Docs (konsisten) |
| **Fallback Arabic** | `Amiri`, `Noto Naskh Arabic` (Google Fonts, di-import di `css/shell.css`) | Salam/greeting & teks Arab agar glyph benar |
| **Monospace/kode** | `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace` | Blok kode & inline code (`article.css`, `style.css`) |

- **Cara kerja:** `css/shell.css` mendefinisikan token/variabel global (`--bg`, `--text`, `--muted`, `--line`, `--accent`) dan font dasar shell/nav; tiap halaman memuat stylesheet yang relevan (`home.css`, `style.css`, `article.css`, `docs.css`) sehingga tampilan konsisten namun tetap bisa diatur per konteks. Warna kanvas gelap (`#0d1117`) dipilih untuk kenyamanan baca, dengan teks `#e6edf3` dan muted `#8b949e`.

## Topologi sistem (bukan struktur folder)

```text
                         ┌────────────────────────────────────┐
                         │   Browser (imoon07.github.io)      │
                         └─────────────────┬──────────────────┘
                                           │ memuat HTML/CSS/JS statis
                                           ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                        Repo ini: imoon07.github.io (static)                  │
│                                                                              │
│  [Halaman]              [CSS]                         [JS / Data & Engine]  │
│  index.html  ───────▶  shell.css + home.css   ───▶  home.js                 │
│   (Home+About)                                       (transisi/tab/panel,  │
│                                                      logo digital rain)      │
│  blog.html   ───────▶  shell.css + style.css  ───▶  blog-data.js (manifest) │
│   (listing)             + docs.css                 + main.js (fetch meta,    │
│                                                      filter, paginasi, UI)   │
│  read.html   ───────▶  shell.css + article.css ───▶  blog-data.js + read.js  │
│   (reader)             (+ docs.css bila perlu)       (fetch .md, marked,     │
│                                                      DOMPurify, TOC, dll)   │
│  references.html ───▶  shell+article+docs.css  ───▶  docs-references-data.js │
│   (docs hub)                                         (manifest modul) +      │
│                                                      read.js/references.js   │
└───────────────┬───────────────────────────────────────────────┬──────────────┘
                │ fetch raw Markdown (runtime)                  │ load logo SVG (CDN)
                ▼                                               ▼
┌───────────────────────────────────────┐     ┌─────────────────────────────────┐
│ Penjelajah-CyberSecurity (GitHub)     │     │ iMoon07/logo-svg (GitHub, CDN)  │
│ - Articles: .../*-id.md, *-en.md      │     │ jsDelivr: @main/ (digital rain  │
│ - References: References/*-en.md      │     │ di background About/home.js)    │
│ diambil via raw.githubusercontent.com │     └─────────────────────────────────┘
└───────────────────────────────────────┘
```

## Struktur & peran file penting

- **Halaman:** `index.html` (Home & About dalam satu dokumen), `blog.html` (daftar artikel), `read.html` (pembaca artikel/markdown), `references.html` (hub dokumentasi/referensi), `about.html` (standalone/redirect context).
- **CSS:** `css/shell.css` (kanvas, variabel warna, nav, font global), `css/home.css` (layout Home/About, tab/panel, portrait, kontak), `css/style.css` (gaya umum & listing blog), `css/article.css` (pengalaman baca artikel), `css/docs.css` (layout docs/references).
- **JS & data:**
  - `js/blog-data.js` — **manifest blog**: array `myProjects` berisi entri artikel (`id`, `title`, `category`, `tags`, `publishedDate`, `rawUrl`, `repoUrl`, dll). Ini sumber daftar di blog.
  - `js/main.js` — **mesin listing blog**: fetch metadata/konten ringkas dari `rawUrl`, filter, pencarian, paginasi, render kartu (dipakai `blog.html`).
  - `js/read.js` — **reader**: mengambil markdown (dari `rawUrl`/`doc`/`ref`), me-resolve varian bahasa (mis. `-id.md`/`-en.md`), merender dengan **marked** + sanitasi **DOMPurify**, membangun TOC, navigasi, dan fitur baca.
  - `js/docs-references-data.js` — **manifest docs/references**: `REFERENCE_MODULES` (id, title, group, `src` ke raw markdown di repo `Penjelajah-CyberSecurity/References/`).
  - `js/references.js` — logika halaman/docs navigation/search di hub referensi.
  - `js/home.js` — navigasi Home/About (SPA-like dalam satu dokumen), tab/panel, interaksi, dan **logo digital rain**.
  - `js/markdown.js` — ekstensi/aturan markdown tambahan bila digunakan oleh reader.

## Cara kerja data & rendering

1. **Home/About:** `index.html` + `home.js` mengelola perpindahan tampilan, panel (Profile/Experience/Community/License), dan animasi tanpa reload penuh. Latar “digital rain” logo mengambil SVG dari `https://cdn.jsdelivr.net/gh/iMoon07/logo-svg@main/` (repo https://github.com/iMoon07/logo-svg) dengan daftar logo terkurasi di `home.js`.
2. **Blog listing:** `blog.html` memuat `blog-data.js` lalu `main.js`. `main.js` membaca `myProjects`, mengambil data dari `rawUrl` (raw GitHub) untuk metadata/preview, lalu menampilkan daftar terfilter/paginasi. Link artikel membuka `read.html?post=<id>`.
3. **Reader artikel:** `read.html` + `read.js` mencari entri berdasarkan `post` di `myProjects`, menentukan sumber markdown (dan varian bahasa, mis. `-id` ↔ `-en`), fetch konten dari repo konten, lalu render HTML aman (marked + DOMPurify).
4. **Docs/References:** `references.html` memuat manifest `docs-references-data.js` (`src` menunjuk ke `.../Penjelajah-CyberSecurity/main/References/*-en.md`) dan merender konten melalui alur reader/references.

## Cara pakai & menambah konten

### Pratinjau lokal (tidak perlu build)

```bash
cd imoon07.github.io
python3 -m http.server 8000
# buka http://localhost:8000
```

> Catatan: fetch konten blog/docs mengambil markdown dari GitHub raw (repo `Penjelajah-CyberSecurity`) sehingga butuh koneksi internet; beberapa perilaku fetch bisa berbeda saat dibuka langsung via `file://`.

### Upload / menambah posting blog

Konten markdown blog dikelola di repo **Penjelajah-CyberSecurity**; repo situs ini hanya menyimpan manifest & tampilannya.

1. **Tulis & push markdown** ke repo `Penjelajah-CyberSecurity` (ikuti konvensi penamaan bahasa, mis. `nama-artikel-id.md` dan/atau `nama-artikel-en.md`).
2. **Daftarkan di situs**: edit `js/blog-data.js`, tambahkan objek ke `myProjects`, contoh:

   ```js
   {
     id: "slug-unik-artikel",
     title: "Judul Artikel",
     category: "web-security",
     tags: ["tag1", "tag2"],
     publishedDate: "YYYY-MM-DD",
     publishedTime: "HH:mm",
     rawUrl: "https://raw.githubusercontent.com/iMoon07/Penjelajah-CyberSecurity/main/path/ke/file-id.md",
     repoUrl: "https://github.com/iMoon07/Penjelajah-CyberSecurity/tree/main/path/ke/folder",
   }
   ```

3. **Commit & push** repo `imoon07.github.io` — GitHub Pages akan menyajikan perubahan ke https://imoon07.github.io/.

### Menambah referensi/docs

Tambahkan entri pada `REFERENCE_MODULES` di `js/docs-references-data.js` dengan `id`, `title`, `group`, dan `src` (raw URL ke file `*-en.md` di `Penjelajah-CyberSecurity/References/`), lalu pastikan file markdown-nya ada di repo konten.

## Catatan pengembangan (next)

- **Modular config About:** rencanakan pemisahan data About (profil, pengalaman, komunitas, lisensi, tautan sosial) ke satu sumber/konfigurasi terpusat (mis. file data/config JS) agar pembaruan konten & urutan panel lebih mudah tanpa mengubah banyak markup—memudahkan gonta-ganti isi.

## SEO & aset pendukung

`robots.txt`, `sitemap.xml`, `BingSiteAuth.xml`, dan verifikasi Google disertakan untuk kebutuhan indexing. Aset gambar/logo lokal berada di `assets/`.

## Lisensi

Lihat [LICENSE](LICENSE).

---

Built portofolio to success.
