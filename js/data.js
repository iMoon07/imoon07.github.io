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
    publishedDate: "2025-01-01",
    rawUrl:
      "https://raw.githubusercontent.com/iMoon07/Penjelajah-CyberSecurity/main/blog-post-template/template-for-you-id.md",
    repoUrl: "https://github.com/iMoon07/imoon07.github.io/",
  },

  {
    id: "owasp-toolkit",
    title: "Build Your Own Hacking Dojo: OWASP Lab Toolkit",
    category: "experiments",
    tags: ["labs", "owasp", "bash", "ubuntu", "self-hosted"],
    publishedDate: "2025-01-18",
    rawUrl:
      "https://raw.githubusercontent.com/iMoon07/Penjelajah-CyberSecurity/main/Experiments/OWASP-LAB-TOOLKIT/owasp-lab-toolkit-id.md",
    repoUrl: "https://github.com/iMoon07/Penjelajah-CyberSecurity",
  },

  {
    id: "lynx",
    title: "Server Single-Tier Stack",
    category: "notes",
    tags: ["server", "linux", "web-stack", "deployment", "virtualization", "networking", "web-security", "system-administration", "open-source"],
    publishedDate: "2025-02-04",
    rawUrl:
      "https://raw.githubusercontent.com/iMoon07/Penjelajah-CyberSecurity/main/Experiments/LYNX/server-single-tier-stack-id.md",
    repoUrl:
      "https://github.com/iMoon07/Penjelajah-CyberSecurity/tree/main/Experiments/LYNX",
  },

  {
    id: "hardening-single-tier-stack",
    title: "Hardening Single-Tier Stack",
    category: "notes",
    tags: ["hardening", "server-security", "linux-security", "security-configuration", "network-security", "web-security", "monitoring", "backup-recovery", "incident-response"],
    publishedDate: "2025-02-21",
    rawUrl:
      "https://raw.githubusercontent.com/iMoon07/Penjelajah-CyberSecurity/main/Experiments/foundations/server-security/hardening-single-tier-stack-id.md",
    repoUrl:
      "https://github.com/iMoon07/Penjelajah-CyberSecurity/tree/main/Experiments/foundations/server-security",
  },

  {
    id: "server-single-tier-stack",
    title: "Server Single-Tier Stack",
    category: "notes",
    tags: ["auto"],
    publishedDate: "2025-03-10",
    rawUrl:
      "https://raw.githubusercontent.com/iMoon07/Penjelajah-CyberSecurity/main/Experiments/foundations/server-architecture/server-single-tier-stack-id.md",
    repoUrl:
      "https://github.com/iMoon07/Penjelajah-CyberSecurity/tree/main/Experiments/foundations/server-architecture",
  },
  {
    id: "hardening-single-tier-stack",
    title: "Hardening Single-Tier Stack",
    category: "notes",
    tags: ["auto"],
    publishedDate: "2025-03-27",
    rawUrl:
      "https://raw.githubusercontent.com/iMoon07/Penjelajah-CyberSecurity/main/Experiments/foundations/server-security/hardening-single-tier-stack-id.md",
    repoUrl:
      "https://github.com/iMoon07/Penjelajah-CyberSecurity/tree/main/Experiments/foundations/server-security",
  },
  {
    id: "from-hardware-to-software-how-applications-actually-run",
    title: "Dari Perangkat Keras ke Perangkat Lunak: Bagaimana Aplikasi Benar-Benar Berjalan",
    category: "notes",
    tags: ["auto"],
    publishedDate: "2025-04-13",
    rawUrl:
      "https://raw.githubusercontent.com/iMoon07/Penjelajah-CyberSecurity/main/Experiments/foundations/system-foundations/from-hardware-to-software-how-applications-actually-run-id.md",
    repoUrl:
      "https://github.com/iMoon07/Penjelajah-CyberSecurity/tree/main/Experiments/foundations/system-foundations",
  },
  {
    id: "linux-enumeration-investigation",
    title: "Linux: Execution, History, and Timeline Analysis",
    category: "experiments",
    tags: ["auto"],
    publishedDate: "2025-04-30",
    rawUrl:
      "https://raw.githubusercontent.com/iMoon07/Penjelajah-CyberSecurity/main/Experiments/linux-post-exploitation/LINUX-ENUMERATION-INVESTIGATION/linux-enumeration-investigation-id.md",
    repoUrl:
      "https://github.com/iMoon07/Penjelajah-CyberSecurity/tree/main/Experiments/linux-post-exploitation/LINUX-ENUMERATION-INVESTIGATION",
  },
  {
    id: "post-exploitation-enum",
    title: "Linux Enumeration: Basic System Information",
    category: "experiments",
    tags: ["auto"],
    publishedDate: "2025-05-17",
    rawUrl:
      "https://raw.githubusercontent.com/iMoon07/Penjelajah-CyberSecurity/main/Experiments/linux-post-exploitation/POST-EXPLOITATION-ENUMERATION/post-exploitation-enum-id.md",
    repoUrl:
      "https://github.com/iMoon07/Penjelajah-CyberSecurity/tree/main/Experiments/linux-post-exploitation/POST-EXPLOITATION-ENUMERATION",
  },
  {
    id: "post-exploitation-filesystemexplore",
    title: "Linux Post-Exploitation: File System Exploration",
    category: "experiments",
    tags: ["auto"],
    publishedDate: "2025-06-03",
    rawUrl:
      "https://raw.githubusercontent.com/iMoon07/Penjelajah-CyberSecurity/main/Experiments/linux-post-exploitation/POST-EXPLOITATION-FILE-SYSTEM-EXPLORE/post-exploitation-filesystemexplore-id.md",
    repoUrl:
      "https://github.com/iMoon07/Penjelajah-CyberSecurity/tree/main/Experiments/linux-post-exploitation/POST-EXPLOITATION-FILE-SYSTEM-EXPLORE",
  },
  {
    id: "post-exploitation-foothold",
    title: "Linux Foothold: Establishing a C2 Session with Adaptix Framework",
    category: "experiments",
    tags: ["auto"],
    publishedDate: "2025-06-20",
    rawUrl:
      "https://raw.githubusercontent.com/iMoon07/Penjelajah-CyberSecurity/main/Experiments/linux-post-exploitation/POST-EXPLOITATION-FOOTHOLD/post-exploitation-foothold-id.md",
    repoUrl:
      "https://github.com/iMoon07/Penjelajah-CyberSecurity/tree/main/Experiments/linux-post-exploitation/POST-EXPLOITATION-FOOTHOLD",
  },
  {
    id: "post-exploitation-lateral-movement",
    title: "Linux Lateral Movement: Internal Network Assessment dan Validasi Samba CVE-2026-4480 (Debian)",
    category: "experiments",
    tags: ["auto"],
    publishedDate: "2025-07-07",
    rawUrl:
      "https://raw.githubusercontent.com/iMoon07/Penjelajah-CyberSecurity/main/Experiments/linux-post-exploitation/POST-EXPLOITATION-LATERAL-MOVEMENT/post-exploitation-lateral-movement-id.md",
    repoUrl:
      "https://github.com/iMoon07/Penjelajah-CyberSecurity/tree/main/Experiments/linux-post-exploitation/POST-EXPLOITATION-LATERAL-MOVEMENT",
  },
  {
    id: "post-exploitation-persistence",
    title: "Linux Persistence: Getting Started with PANIX",
    category: "experiments",
    tags: ["auto"],
    publishedDate: "2025-07-24",
    rawUrl:
      "https://raw.githubusercontent.com/iMoon07/Penjelajah-CyberSecurity/main/Experiments/linux-post-exploitation/POST-EXPLOITATION-PERSISTENT/post-exploitation-persistence-id.md",
    repoUrl:
      "https://github.com/iMoon07/Penjelajah-CyberSecurity/tree/main/Experiments/linux-post-exploitation/POST-EXPLOITATION-PERSISTENT",
  },
  {
    id: "post-exploitation-pivoting",
    title: "Linux Pivoting: Exploring Internal Network Access with AdaptixC2 SOCKS5 Tunnel and Proxychains",
    category: "experiments",
    tags: ["auto"],
    publishedDate: "2025-08-10",
    rawUrl:
      "https://raw.githubusercontent.com/iMoon07/Penjelajah-CyberSecurity/main/Experiments/linux-post-exploitation/POST-EXPLOITATION-PIVOTING/post-exploitation-pivoting-id.md",
    repoUrl:
      "https://github.com/iMoon07/Penjelajah-CyberSecurity/tree/main/Experiments/linux-post-exploitation/POST-EXPLOITATION-PIVOTING",
  },
  {
    id: "post-exploitation-priv-enum",
    title: "Linux Post-Exploitation: Privilege Enumeration",
    category: "experiments",
    tags: ["auto"],
    publishedDate: "2025-08-27",
    rawUrl:
      "https://raw.githubusercontent.com/iMoon07/Penjelajah-CyberSecurity/main/Experiments/linux-post-exploitation/POST-EXPLOITATION-PRIVILEGE-ENUMERATION/post-exploitation-priv-enum-id.md",
    repoUrl:
      "https://github.com/iMoon07/Penjelajah-CyberSecurity/tree/main/Experiments/linux-post-exploitation/POST-EXPLOITATION-PRIVILEGE-ENUMERATION",
  },
  {
    id: "post-exploitation-priv-esca-copyfail",
    title: "Linux Kernel Privilege Escalation: Copy.Fail (CVE-2026-31431)",
    category: "experiments",
    tags: ["auto"],
    publishedDate: "2025-09-13",
    rawUrl:
      "https://raw.githubusercontent.com/iMoon07/Penjelajah-CyberSecurity/main/Experiments/linux-post-exploitation/POST-EXPLOITATION-PRIVILEGE-ESCALATION/post-exploitation-priv-esca-copyfail-id.md",
    repoUrl:
      "https://github.com/iMoon07/Penjelajah-CyberSecurity/tree/main/Experiments/linux-post-exploitation/POST-EXPLOITATION-PRIVILEGE-ESCALATION",
  },
  {
    id: "network-hacking-basic",
    title: "Socket Programming Experiments with Python",
    category: "experiments",
    tags: ["auto"],
    publishedDate: "2025-09-30",
    rawUrl:
      "https://raw.githubusercontent.com/iMoon07/Penjelajah-CyberSecurity/main/Experiments/network-security/network-hacking-basic/network-hacking-basic-id.md",
    repoUrl:
      "https://github.com/iMoon07/Penjelajah-CyberSecurity/tree/main/Experiments/network-security/network-hacking-basic",
  },
  {
    id: "build-tcp-udp-proxy-lab",
    title: "TCP & UDP Proxy Lab — Analisis Traffic FTP",
    category: "experiments",
    tags: ["auto"],
    publishedDate: "2025-10-17",
    rawUrl:
      "https://raw.githubusercontent.com/iMoon07/Penjelajah-CyberSecurity/main/Experiments/network-security/proxy-network-basic/build-tcp-udp-proxy-lab-id.md",
    repoUrl:
      "https://github.com/iMoon07/Penjelajah-CyberSecurity/tree/main/Experiments/network-security/proxy-network-basic",
  },
  {
    id: "ssh-client-server-python",
    title: "SSH Client-Server Experiments with Python Paramiko",
    category: "experiments",
    tags: ["auto"],
    publishedDate: "2025-11-03",
    rawUrl:
      "https://raw.githubusercontent.com/iMoon07/Penjelajah-CyberSecurity/main/Experiments/network-security/ssh-network-basic/ssh-client-server-python-id.md",
    repoUrl:
      "https://github.com/iMoon07/Penjelajah-CyberSecurity/tree/main/Experiments/network-security/ssh-network-basic",
  },
  {
    id: "trace-network-basic",
    title: "Basic Network Tracing: TCP dan UDP",
    category: "experiments",
    tags: ["auto"],
    publishedDate: "2025-11-20",
    rawUrl:
      "https://raw.githubusercontent.com/iMoon07/Penjelajah-CyberSecurity/main/Experiments/network-security/trace-network-basic/trace-network-basic-id.md",
    repoUrl:
      "https://github.com/iMoon07/Penjelajah-CyberSecurity/tree/main/Experiments/network-security/trace-network-basic",
  },
  {
    id: "moon-ecosystem",
    title: "My Assistant AI-Local 🌙Moon Toolkit",
    category: "experiments",
    tags: ["auto"],
    publishedDate: "2025-12-07",
    rawUrl:
      "https://raw.githubusercontent.com/iMoon07/Penjelajah-CyberSecurity/main/Experiments/tools/MoonAI-TOOLKIT/moon-ecosystem-id.md",
    repoUrl:
      "https://github.com/iMoon07/Penjelajah-CyberSecurity/tree/main/Experiments/tools/MoonAI-TOOLKIT",
  },
  {
    id: "command-injection-reverse-shell",
    title: "Reverse Shell with One-Lin3r: Crafting a Reverse Shell Payload in a Single Command",
    category: "experiments",
    tags: ["auto"],
    publishedDate: "2025-12-24",
    rawUrl:
      "https://raw.githubusercontent.com/iMoon07/Penjelajah-CyberSecurity/main/Experiments/web-security/COMMAND-INJECTION-REVERSE-SHELL/command-injection-reverse-shell-id.md",
    repoUrl:
      "https://github.com/iMoon07/Penjelajah-CyberSecurity/tree/main/Experiments/web-security/COMMAND-INJECTION-REVERSE-SHELL",
  },
  {
    id: "owasp-lab-toolkit",
    title: "Build Your Own Hacking Dojo: OWASP Lab Toolkit",
    category: "experiments",
    tags: ["auto"],
    publishedDate: "2026-01-10",
    rawUrl:
      "https://raw.githubusercontent.com/iMoon07/Penjelajah-CyberSecurity/main/Experiments/web-security/OWASP-LAB-TOOLKIT/owasp-lab-toolkit-id.md",
    repoUrl:
      "https://github.com/iMoon07/Penjelajah-CyberSecurity/tree/main/Experiments/web-security/OWASP-LAB-TOOLKIT",
  },
  {
    id: "sqli-webshell-reverse-shell",
    title: "SQLi: From Injection to Webshell and Reverse Shell",
    category: "experiments",
    tags: ["auto"],
    publishedDate: "2026-01-27",
    rawUrl:
      "https://raw.githubusercontent.com/iMoon07/Penjelajah-CyberSecurity/main/Experiments/web-security/SQLI-WEBSHELL-REVSHELL/sqli-webshell-reverse-shell-id.md",
    repoUrl:
      "https://github.com/iMoon07/Penjelajah-CyberSecurity/tree/main/Experiments/web-security/SQLI-WEBSHELL-REVSHELL",
  },
  {
    id: "webshell-reverse-shell",
    title: "Unrestricted File Upload: From Webshell to Reverse Shell Access",
    category: "experiments",
    tags: ["auto"],
    publishedDate: "2026-02-13",
    rawUrl:
      "https://raw.githubusercontent.com/iMoon07/Penjelajah-CyberSecurity/main/Experiments/web-security/WEBSHELL-REVERSE-SHELL/webshell-reverse-shell-id.md",
    repoUrl:
      "https://github.com/iMoon07/Penjelajah-CyberSecurity/tree/main/Experiments/web-security/WEBSHELL-REVERSE-SHELL",
  },
  {
    id: "template-for-you",
    title: "Write for Fun, Build for Enjoy",
    category: "experiments",
    tags: ["auto"],
    publishedDate: "2026-03-02",
    rawUrl:
      "https://raw.githubusercontent.com/iMoon07/Penjelajah-CyberSecurity/main/blog-post-template/template-for-you-id.md",
    repoUrl:
      "https://github.com/iMoon07/Penjelajah-CyberSecurity/tree/main/blog-post-template",
  },
];
