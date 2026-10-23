/* =============================================================================
   DATA ARTIKEL / ARTICLE DATA
   Satu objek per artikel. Dipakai oleh blog listing dan halaman reader.
   One object per article. Used by the blog listing and the article reader.

   Struktur dan aturan field dijelaskan di bawah (ID lalu EN).
   Field structure and rules are documented below (ID then EN).
   ============================================================================= */
// Data artikel / Article data
// Tambah satu objek per artikel.
// Tambahkan satu objek per artikel.
// Field "category" dan "tags" bebas:
// tab Categories dan Tags di halaman blog dibuat otomatis dari data di bawah.
//
// category : "experiments" | "tutorials" | ... (nilai bebas, pakai tanda hubung untuk kategori berkatasa)
// tags     : ["labs", "web", ...] (bebas, jumlah tidak dibatasi)
//
// title    = judul artikel. Dipakai untuk pencarian di halaman blog dan
//            daftar artikel terkait, jadi tidak perlu nunggu markdown di-fetch.
//            Kalau judulnya beda antara ID dan EN, pakai titleId / titleEn.
// rawUrl  = URL Markdown Indonesia (file *-id.md) di repo Penjelajah-CyberSecurity.
// Versi Inggris otomatis diambil dari file *-en.md di lokasi yang sama.
// repoUrl = halaman repository tempat catatan ini hidup (bukan raw, bukan
// repo source code project yang dibahas). Kalau kosong, diturunkan dari rawUrl.
//
// Tanggal:
// publishedDate = tanggal artikel benar-benar ditulis. WAJIB isi manual,
//   karena "push ke repo duluan" belum tentu berarti "blog-nya terbit" --
//   kalau lo push semua artikel sekaligus, commit pertama semua file akan
//   berbarengan dan tidak berguna sebagai tanggal publish.
// lastEditedDate = TIDAK perlu diisi. Tanggal "diperbarui" diambil otomatis
//   dari commit terakhir file di GitHub, lengkap dengan link commit-nya.
const myProjects = [
  {
    id: "blog-post-template",
    title: "Write for Fun, Build for Enjoy",
    category: "experiments",
    tags: ["markdown", "blog", "template"],
    publishedDate: "2025-05-10",
    rawUrl:
      "https://raw.githubusercontent.com/iMoon07/Penjelajah-CyberSecurity/main/blog-post-template/template-for-you-id.md",
    repoUrl: "https://github.com/iMoon07/imoon07.github.io/",
  },

  {
    id: "owasp-toolkit",
    title: "Build Your Own Hacking Dojo: OWASP Lab Toolkit",
    category: "experiments",
    tags: ["labs", "owasp", "bash", "ubuntu", "self-hosted"],
    publishedDate: "2025-05-15",
    rawUrl:
      "https://raw.githubusercontent.com/iMoon07/Penjelajah-CyberSecurity/main/Experiments/OWASP-LAB-TOOLKIT/owasp-lab-toolkit-id.md",
    repoUrl: "https://github.com/iMoon07/Penjelajah-CyberSecurity",
  },

  {
    id: "lynx",
    title: "Server Single-Tier Stack",
    category: "notes",
    tags: ["server", "linux", "web-stack", "deployment", "virtualization", "networking", "web-security", "system-administration", "open-source"],
    publishedDate: "2026-10-21",
    rawUrl:
      "https://raw.githubusercontent.com/iMoon07/Penjelajah-CyberSecurity/main/Experiments/LYNX/linux-exposure-network-experiment-id.md",
    repoUrl:
      "https://github.com/iMoon07/Penjelajah-CyberSecurity/tree/main/Experiments/LYNX",
  },

  {
    id: "hardening-single-tier-stack",
    title: "Hardening Single-Tier Stack",
    category: "notes",
    tags: ["hardening", "server-security", "linux-security", "security-configuration", "network-security", "web-security", "monitoring", "backup-recovery", "incident-response"],
    publishedDate: "2026-10-23",
    rawUrl:
      "https://raw.githubusercontent.com/iMoon07/Penjelajah-CyberSecurity/main/Experiments/LYNX/hardening-single-tier-stack-id.md",
    repoUrl:
      "https://github.com/iMoon07/Penjelajah-CyberSecurity/tree/main/Experiments/LYNX",
  },
  
];
