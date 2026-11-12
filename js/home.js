/* =============================================================================
   NAVIGASI HALAMAN / PAGE NAVIGATION
   Home dan About berbagi satu dokumen: perpindahan halaman, slider pengalaman,
   panel komunitas, dan gestur sentuh.
   Home and About share a single document: page transitions, the experience
   slider, the community panels, and touch gestures.

   Markup ada di index.html, gaya bersama di css/home.css.
   Markup lives in index.html, shared styles in css/home.css.
   ============================================================================= */
(() => {
            'use strict';

            const pages = {
                home: document.getElementById('homePage'),
                about: document.getElementById('aboutPage'),
                references: document.getElementById('referencesPage')
            };

            const pageLinks = document.querySelectorAll('[data-page]');

            const reducedMotion = window.matchMedia(
                '(prefers-reduced-motion: reduce)'
            );

            let activePage = 'home';
            let transitionToken = 0;

            const wait = duration => new Promise(resolve => {
                setTimeout(resolve, duration);
            });

            function updateNavigation(name) {
                pageLinks.forEach(link => {
                    const current = link.dataset.page === name;

                    if (current) {
                        link.setAttribute('aria-current', 'page');
                    } else {
                        link.removeAttribute('aria-current');
                    }
                });
            }

            async function showPage(name, focusTarget = true) {
                if (!pages[name]) name = 'home';

                const token = ++transitionToken;

                if (name === activePage) {
                    Object.values(pages).forEach(page => {
                        page.classList.remove('leaving');
                    });

                    updateNavigation(name);
                    return;
                }

                const outgoing = pages[activePage];

                outgoing.classList.remove('entering');
                outgoing.classList.add('leaving');

                await wait(reducedMotion.matches ? 0 : 180);

                if (token !== transitionToken) return;

                Object.values(pages).forEach(page => {
                    page.hidden = true;
                    page.classList.remove('entering', 'leaving');
                });

                const incoming = pages[name];

                incoming.hidden = false;
                incoming.classList.add('entering');

                activePage = name;
                updateNavigation(name);

                if (name === 'about') {
                    const activeTab = tabs[selectedPanel];
                    const activePanel = activeTab ? document.getElementById(activeTab.getAttribute('aria-controls')) : null;
                    setCalmText(pages.about);
                    startChaos();
                } else {
                    stopCalmText();
                    stopChaos();
                }

                window.scrollTo({
                    top: 0,
                    behavior: 'auto'
                });

                if (focusTarget) {
                    const target = name === 'about'
                        ? document.querySelector('.tab[aria-selected="true"]')
                        : name === 'references'
                            ? document.getElementById('referencesTitle')
                            : document.getElementById('homeTitle');

if (name === 'home') {
                    if (target) target.setAttribute('tabindex', '-1');
                    startTypewriter();
                    startSubtitle();
                } else {
                    stopTypewriter();
                }

                if (target) target.focus({ preventScroll: true });
                }
            }

            pageLinks.forEach(link => {
                link.addEventListener('click', event => {
                    event.preventDefault();

                    const name = link.dataset.page;

                    if (location.hash !== '#' + name) {
                        location.hash = name;
                    } else {
                        showPage(name);

                        window.scrollTo({
                            top: 0,
                            behavior: 'auto'
                        });
                    }
                });
            });

            /* ------------------------------------------------------------ cross page navigation
               Transisi antar halaman home dan about.
               Transitions between the home and about pages. */

            const externalLinks = document.querySelectorAll(
                '.navigation .nav-item[href$=".html"]'
            );

            async function navigateTo(url) {
                const outgoing = pages[activePage];

                outgoing.classList.remove('entering');
                outgoing.classList.add('leaving');

                await wait(reducedMotion.matches ? 0 : 180);

                window.location.href = url;
            }

            externalLinks.forEach(link => {
                link.addEventListener('click', event => {
                    event.preventDefault();

                    navigateTo(link.getAttribute('href'));
                });
            });

            window.addEventListener('hashchange', () => {
                var hash = (location.hash || '').replace('#', '');
                showPage(hash === 'about' ? 'about' : hash === 'references' ? 'references' : 'home');
            });

            /* ------------------------------------------------------------ about slider
               Slider pengalaman: satu panel aktif, transisi halus.
               Experience slider: one active panel, smooth transition. */

            const tabs = Array.from(
                document.querySelectorAll('.tab')
            );

            const viewport = document.getElementById('panelViewport');
            const counter = document.getElementById('panelCounter');

            let selectedPanel = 0;

            function selectPanel(index, focusTab = false) {
                const next =
                    (index + tabs.length) % tabs.length;

                const direction =
                    index < selectedPanel ? '-22px' : '22px';

                tabs.forEach((tab, tabIndex) => {
                    const active = tabIndex === next;

                    const panel = document.getElementById(
                        tab.getAttribute('aria-controls')
                    );

                    tab.setAttribute(
                        'aria-selected',
                        String(active)
                    );

                    tab.tabIndex = active ? 0 : -1;
                    panel.hidden = !active;
                    panel.classList.remove('active');

                    if (active) {
                        panel.style.setProperty(
                            '--slide-from',
                            direction
                        );

                        void panel.offsetWidth;
                        panel.classList.add('active');
                    }
                });

                selectedPanel = next;

                counter.textContent =
                    String(next + 1).padStart(2, '0') +
                    ' / ' +
                    String(tabs.length).padStart(2, '0');

                const activePanel = document.getElementById(
                    tabs[next].getAttribute('aria-controls')
                );
                setCalmText(activePanel);

                if (focusTab) {
                    tabs[next].focus({ preventScroll: true });
                }
            }

            tabs.forEach((tab, index) => {
                tab.addEventListener('click', () => {
                    selectPanel(index);
                });

                tab.addEventListener('keydown', event => {
                    let next;

                    switch (event.key) {
                        case 'ArrowRight':
                            next = selectedPanel + 1;
                            break;

                        case 'ArrowLeft':
                            next = selectedPanel - 1;
                            break;

                        case 'Home':
                            next = 0;
                            break;

                        case 'End':
                            next = tabs.length - 1;
                            break;

                        default:
                            return;
                    }

                    event.preventDefault();
                    selectPanel(next, true);
                });
            });

            document.getElementById('previousPanel')
                .addEventListener('click', () => {
                    selectPanel(selectedPanel - 1);
                });

            document.getElementById('nextPanel')
                .addEventListener('click', () => {
                    selectPanel(selectedPanel + 1);
                });

            /* ------------------------------------------------------------ experience details
               Detail pengalaman: isi panel sesuai pilihan.
               Experience details: fill the panel according to the selection. */

            const experienceViews = {
                list: document.getElementById('experienceList'),
                merdeka: document.getElementById('merdekaDetail'),
                lpro: document.getElementById('lproDetail'),
                xcode: document.getElementById('xcodeDetail'),
                recognition: document.getElementById('recognitionDetail'),
                recBengkulu: document.getElementById('recBengkuluDetail'),
                recPrague: document.getElementById('recPragueDetail'),
                recDetik: document.getElementById('recDetikDetail'),
                recMagelang: document.getElementById('recMagelangDetail'),
                recDki: document.getElementById('recDkiDetail'),
                recKukar: document.getElementById('recKukarDetail'),
                recKpi: document.getElementById('recKpiDetail'),
                recTransjakarta: document.getElementById('recTransjakartaDetail'),
                recPasuruan: document.getElementById('recPasuruanDetail')
            };

            const experienceButtons = Array.from(
                document.querySelectorAll('[data-open-experience]')
            );

            let experienceOpener = null;

            function showExperience(name) {
                Object.entries(experienceViews)
                    .forEach(([key, view]) => {
                        const active = key === name;

                        view.hidden = !active;
                        view.classList.remove('active');

                        if (active) {
                            void view.offsetWidth;
                            view.classList.add('active');
                        }
                    });

                experienceButtons.forEach(button => {
                    button.setAttribute(
                        'aria-expanded',
                        String(
                            button.dataset.openExperience === name
                        )
                    );
                });
            }

            experienceButtons.forEach(button => {
                button.addEventListener('click', () => {
                    experienceOpener = button;

                    const name = button.dataset.openExperience;

                    showExperience(name);

                    experienceViews[name]
                        .querySelector('h2')
                        .focus({ preventScroll: true });
                });
            });

            document.querySelectorAll('[data-back-experience]')
                .forEach(button => {
                    button.addEventListener('click', () => {
                        const target = button.dataset.backExperience || 'list';
                        showExperience(target);

                        if (experienceOpener) {
                            experienceOpener.focus({
                                preventScroll: true
                            });
                        }
                    });
                });

            /* ------------------------------------------------------------ community details
               Detail komunitas: isi panel sesuai pilihan.
               Community details: fill the panel according to the selection. */

            const communityViews = {
                list: document.getElementById('communityList'),
                codelines: document.getElementById('codelinesDetail'),
                codingceria: document.getElementById('codingceriaDetail'),
                debuglife: document.getElementById('debuglifeDetail')
            };

            const communityButtons = Array.from(
                document.querySelectorAll('[data-open-community]')
            );

            let communityOpener = null;

            function showCommunity(name) {
                Object.entries(communityViews)
                    .forEach(([key, view]) => {
                        const active = key === name;

                        view.hidden = !active;
                        view.classList.remove('active');

                        if (active) {
                            void view.offsetWidth;
                            view.classList.add('active');
                        }
                    });

                communityButtons.forEach(button => {
                    button.setAttribute(
                        'aria-expanded',
                        String(
                            button.dataset.openCommunity === name
                        )
                    );
                });
            }

            communityButtons.forEach(button => {
                button.addEventListener('click', () => {
                    communityOpener = button;

                    const name = button.dataset.openCommunity;

                    showCommunity(name);

                    communityViews[name]
                        .querySelector('h2')
                        .focus({ preventScroll: true });
                });
            });

            document.querySelectorAll('[data-back-community]')
                .forEach(button => {
                    button.addEventListener('click', () => {
                        showCommunity('list');

                        if (communityOpener) {
                            communityOpener.focus({
                                preventScroll: true
                            });
                        }
                    });
                });

            /* ------------------------------------------------------------ license details
               Detail lisensi: isi panel sesuai pilihan.
               License details: fill the panel according to the selection. */

            const licenseViews = {
                list: document.getElementById('licenseList'),
                mit: document.getElementById('mitDetail'),
                cc: document.getElementById('ccDetail'),
                thirdparty: document.getElementById('thirdpartyDetail')
            };

            const licenseButtons = Array.from(
                document.querySelectorAll('[data-open-license]')
            );

            let licenseOpener = null;

            function showLicense(name) {
                Object.entries(licenseViews)
                    .forEach(([key, view]) => {
                        const active = key === name;

                        view.hidden = !active;
                        view.classList.remove('active');

                        if (active) {
                            void view.offsetWidth;
                            view.classList.add('active');
                        }
                    });

                licenseButtons.forEach(button => {
                    button.setAttribute(
                        'aria-expanded',
                        String(
                            button.dataset.openLicense === name
                        )
                    );
                });
            }

            licenseButtons.forEach(button => {
                button.addEventListener('click', () => {
                    licenseOpener = button;

                    const name = button.dataset.openLicense;

                    showLicense(name);

                    licenseViews[name]
                        .querySelector('h2')
                        .focus({ preventScroll: true });
                });
            });

            document.querySelectorAll('[data-back-license]')
                .forEach(button => {
                    button.addEventListener('click', () => {
                        showLicense('list');

                        if (licenseOpener) {
                            licenseOpener.focus({
                                preventScroll: true
                            });
                        }
                    });
                });

            /* ------------------------------------------------------------ work details
               Detail proyek: isi panel sesuai pilihan.
               Work details: fill the panel according to the selection. */

            const workViews = {
                list: document.getElementById('workList'),
                 owasp: document.getElementById('owaspDetail'),
                 staticWeb: document.getElementById('staticWebDetail'),
                 portfolio: document.getElementById('portfolioDetail')
            };

            const workButtons = Array.from(
                document.querySelectorAll('[data-open-work]')
            );

            let workOpener = null;

            function showWork(name) {
                Object.entries(workViews)
                    .forEach(([key, view]) => {
                        const active = key === name;

                        view.hidden = !active;
                        view.classList.remove('active');

                        if (active) {
                            void view.offsetWidth;
                            view.classList.add('active');
                        }
                    });

                workButtons.forEach(button => {
                    button.setAttribute(
                        'aria-expanded',
                        String(
                            button.dataset.openWork === name
                        )
                    );
                });
            }

            workButtons.forEach(button => {
                button.addEventListener('click', () => {
                    workOpener = button;

                    const name = button.dataset.openWork;

                    showWork(name);

                    workViews[name]
                        .querySelector('h2')
                        .focus({ preventScroll: true });
                });
            });

            document.querySelectorAll('[data-back-work]')
                .forEach(button => {
                    button.addEventListener('click', () => {
                        showWork('list');

                        if (workOpener) {
                            workOpener.focus({
                                preventScroll: true
                            });
                        }
                    });
                });

            /* ------------------------------------------------------------ touch swipe
               Gestur geser untuk berpindah panel di layar sentuh.
               Swipe gestures to move between panels on touch screens. */

            let touchStart = null;

            viewport.addEventListener('touchstart', event => {
                if (
                    event.touches.length !== 1 ||
                    event.target.closest('a, button')
                ) {
                    touchStart = null;
                    return;
                }

                touchStart = {
                    x: event.touches[0].clientX,
                    y: event.touches[0].clientY
                };
            }, { passive: true });

            viewport.addEventListener('touchend', event => {
                if (
                    !touchStart ||
                    !event.changedTouches.length
                ) return;

                const touch = event.changedTouches[0];

                const dx = touch.clientX - touchStart.x;
                const dy = touch.clientY - touchStart.y;

                if (
                    Math.abs(dx) > 55 &&
                    Math.abs(dx) > Math.abs(dy) * 1.5
                ) {
                    selectPanel(
                        selectedPanel + (dx < 0 ? 1 : -1)
                    );
                }

                touchStart = null;
            }, { passive: true });

            viewport.addEventListener('touchcancel', () => {
                touchStart = null;
            }, { passive: true });

            /* ------------------------------------------------------------ portrait curtain
               Tirai potret: animasi buka-tutup untuk halaman about.
               Portrait curtain: the open-close animation for the about page. */

            const portrait = document.getElementById('portrait');

            /* ------------------------------------------------------------ logo digital rain
               Hujan logo ala digital rain di belakang konten About.
               Digital-rain logo field behind About content. */

            const chaosField = document.getElementById('logoChaosField');
            const aboutLayout = document.getElementById('aboutLayout');
            const CHAOS_LOGO_BASE = 'https://cdn.jsdelivr.net/gh/iMoon07/logo-svg@main/';
            // Curated set (60) — valid paths from iMoon07/logo-svg, balanced for performance.
            const chaosLogos = [
                // security — recon/scan/osint (14)
                "security/amass.svg",        "security/nmap.svg",         "security/masscan.svg",       "security/ffuf.svg",
                "security/gobuster.svg",     "security/nikto.svg",        "security/whatweb.svg",       "security/theharvester.svg",
                "security/spiderfoot.svg",   "security/recon-ng.svg",     "security/dnsenum.svg",       "security/dnsrecon.svg",
                "security/fierce.svg",       "security/netdiscover.svg",

                // security — web/proxy/fuzz (10)
                "security/burp-suite.svg",   "security/zaproxy.svg",      "security/sqlmap.svg",        "security/wfuzz.svg",
                "security/commix.svg",       "security/wpscan.svg",       "security/dirb.svg",          "security/dirbuster.svg",
                "security/wapiti.svg",       "security/wafw00f.svg",

                // security — exploit/AD/post-ex/C2 (18)
                "security/metasploit.svg",   "security/impacket.svg",     "security/crackmapexec.svg",  "security/responder.svg",
                "security/bloodhound.svg",   "security/mimikatz.svg",     "security/evil-winrm.svg",    "security/beef-xss.svg",
                "security/setoolkit.svg",    "security/armitage.svg",     "security/powershell-empire.svg", "security/havoc.svg",
                "security/covenant.png",     "security/exploit-db.svg",   "security/enum4linux.svg",    "security/smbmap.svg",
                "security/peass.svg",        "security/powersploit.svg",

                // security — creds/cracking (9)
                "security/john.svg",         "security/hashcat.svg",      "security/hydra.svg",         "security/medusa.svg",
                "security/ophcrack.svg",     "security/cewl.svg",         "security/crunch.svg",        "security/hash-identifier.svg",
                "security/hashid.svg",

                // security — wireless/network/sniff/MITM (15)
                "security/aircrack-ng.svg",  "security/wifite.svg",       "security/airgeddon.svg",     "security/reaver.svg",
                "security/kismet.svg",       "security/bully.svg",        "security/fern-wifi-cracker.svg", "security/bettercap.svg",
                "security/wireshark.svg",    "security/tcpdump.svg",      "security/ettercap.svg",      "security/mitmproxy.svg",
                "security/netcat.svg",       "security/ncat.svg",         "security/proxychains.svg",

                // security — RE/mobile/forensics (11)
                "security/ghidra.svg",       "security/radare2.svg",      "security/apktool.svg",       "security/jadx.svg",
                "security/cutter.svg",       "security/binwalk.svg",      "security/volatility.svg",    "security/autopsy.svg",
                "security/foremost.svg",     "security/yara.svg",         "security/clamav.svg",

                // security — vuln/defense/platform (13)
                "security/trivy.svg",        "security/wazuh.svg",        "security/openvas.svg",       "security/gvm.svg",
                "security/nessus.svg",       "security/lynis.svg",        "security/snort.svg",         "security/owasp.svg",
                "security/kali-linux.svg",   "security/hackthebox.svg",   "security/tryhackme.svg",     "security/virustotal.svg",
                "security/maltego.svg",

                // stack (18)
                "stack/linux.svg",           "stack/arch-linux.svg",      "stack/debian.svg",           "stack/ubuntu.svg",
                "stack/windows.svg",         "stack/android.svg",         "stack/docker.svg",           "stack/kubernetes.svg",
                "stack/terraform.svg",       "stack/ansible.svg",         "stack/aws.svg",              "stack/nginx.svg",
                "stack/postgresql.svg",      "stack/redis.svg",           "stack/git.svg",              "stack/github.svg",
                "stack/grafana.svg",         "stack/prometheus.svg",

                // programming (12)
                "programming/python.svg",    "programming/bash.svg",      "programming/c.svg",          "programming/cplusplus.svg",
                "programming/go.svg",        "programming/rust.svg",      "programming/javascript.svg", "programming/typescript.svg",
                "programming/php.svg",       "programming/java.svg",      "programming/powershell.svg", "programming/lua.svg"
            ];

            let chaos = { items: [], raf: null, active: false, built: false, builtCount: 0, last: 0, busy: false };
            const CHAOS_STATE_KEY = 'imoon07_chaos_rain_v1';

            function saveChaosState() {
                if (!chaos.built || !chaos.items.length) return;
                try {
                    const data = {
                        builtCount: chaos.builtCount,
                        items: chaos.items.map(it => ({
                            name: it.name, x: it.x, y: it.y, size: it.size, speed: it.speed, col: it.col || 0
                        }))
                    };
                    sessionStorage.setItem(CHAOS_STATE_KEY, JSON.stringify(data));
                } catch (_) {}
            }

            function loadChaosState() {
                try {
                    const raw = sessionStorage.getItem(CHAOS_STATE_KEY);
                    if (!raw) return null;
                    const data = JSON.parse(raw);
                    if (!data || !Array.isArray(data.items)) return null;
                    if (data.builtCount !== chaosCount() || data.items.length !== chaosCount()) return null;
                    return data;
                } catch (_) { return null; }
            }

            function chaosEnabled() {
                return chaosField && aboutLayout;
            }

            function chaosCount() {
                return window.innerWidth <= 700 ? 32 : chaosLogos.length;
            }

            function shuffle(arr) {
                for (let i = arr.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [arr[i], arr[j]] = [arr[j], arr[i]];
                }
                return arr;
            }

            function chaosLabel(path) {
                const base = path.split('/').pop().replace(/\.[^.]+$/, '');
                return base.replace(/[-_.]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            }

            let chaosTip = null;
            let chaosTipItem = null;
            let chaosTipTimer = null;

            function ensureChaosTip() {
                if (chaosTip || !chaosField) return;
                chaosTip = document.createElement('div');
                chaosTip.className = 'chaos-tooltip';
                chaosTip.setAttribute('aria-hidden', 'true');
                chaosField.appendChild(chaosTip);
            }

            function positionChaosTip() {
                if (!chaosTip || !chaosTipItem || !chaosTip.classList.contains('show')) return;
                const it = chaosTipItem;
                const w = aboutLayout.clientWidth || 1;
                let x = it.x + it.size / 2;
                let y = it.y - 10;
                x = Math.max(40, Math.min(w - 40, x));
                y = Math.max(18, y);
                chaosTip.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) translate(-50%, -100%)';
            }

            function showChaosTip(it, autoHide) {
                ensureChaosTip();
                if (!chaosTip) return;
                if (chaosTipTimer) { clearTimeout(chaosTipTimer); chaosTipTimer = null; }
                chaosTipItem = it;
                chaosTip.textContent = it.el.dataset.label || '';
                chaosTip.classList.add('show');
                positionChaosTip();
                if (autoHide) {
                    chaosTipTimer = setTimeout(() => { hideChaosTip(); }, 1400);
                }
            }

            function hideChaosTip() {
                if (chaosTipTimer) { clearTimeout(chaosTipTimer); chaosTipTimer = null; }
                chaosTipItem = null;
                if (chaosTip) chaosTip.classList.remove('show');
            }

            function analyzeLogoTone(img) {
                try {
                    const c = document.createElement('canvas');
                    const s = 24;
                    c.width = s; c.height = s;
                    const ctx = c.getContext('2d', { willReadFrequently: true });
                    if (!ctx) return;
                    ctx.clearRect(0, 0, s, s);
                    ctx.drawImage(img, 0, 0, s, s);
                    const data = ctx.getImageData(0, 0, s, s).data;
                    let r = 0, g = 0, b = 0, n = 0;
                    for (let i = 0; i < data.length; i += 4) {
                        const a = data[i + 3];
                        if (a < 40) continue;
                        r += data[i]; g += data[i + 1]; b += data[i + 2];
                        n++;
                    }
                    if (!n) return;
                    r /= n; g /= n; b /= n;
                    const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
                    img.classList.add(luma > 0.72 ? 'logo-light' : 'logo-dark');
                } catch (_) {
                    img.classList.add('logo-dark');
                }
            }

            function buildChaos() {
                if (!chaosEnabled() || (chaos.built && chaos.builtCount === chaosCount())) return false;
                chaosField.innerHTML = '';
                chaos.items = [];
                const saved = loadChaosState();
                let sources, restored = false;
                if (saved) {
                    sources = saved.items;
                    restored = true;
                } else {
                    sources = shuffle(chaosLogos.slice()).slice(0, chaosCount()).map(name => ({ name }));
                }
                const frag = document.createDocumentFragment();
                sources.forEach((src) => {
                    const name = src.name;
                    const img = document.createElement('img');
                    img.className = 'chaos-logo';
                    img.crossOrigin = 'anonymous';
                    img.alt = '';
                    img.loading = 'lazy';
                    img.decoding = 'async';
                    img.draggable = false;

                    let size, speed;
                    if (restored) {
                        size = src.size;
                        speed = src.speed;
                    } else {
                        const depth = 0.35 + Math.random() * 0.65; // 0.35..1
                        const mobile = window.innerWidth <= 700;
                        const base = mobile ? 22 : 28;
                        const span = mobile ? 16 : 22;
                        size = Math.round(base + depth * span);
                        speed = 16 + (1 - depth) * 22 + Math.random() * 16;
                    }
                    const opacity = '0.52';
                    const it = {
                        el: img,
                        name,
                        x: restored ? src.x : 0,
                        y: restored ? src.y : 0,
                        size,
                        speed,
                        col: restored ? (src.col || 0) : 0
                    };
                    img.style.setProperty('--size', size + 'px');
                    img.style.setProperty('--base-opacity', opacity);
                    img.dataset.label = chaosLabel(name);
                    img.addEventListener('load', () => analyzeLogoTone(img), { once: true });
                    img.addEventListener('error', () => img.classList.add('logo-dark'), { once: true });
                    img.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') showChaosTip(it, false); });
                    img.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'touch') hideChaosTip(); });
                    img.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') showChaosTip(it, true); });
                    img.src = CHAOS_LOGO_BASE + name;
                    frag.appendChild(img);
                    chaos.items.push(it);
                });
                chaosField.appendChild(frag);
                chaos.built = true;
                chaos.builtCount = sources.length;
                if (!restored) saveChaosState();
                return restored;
            }

            function layoutChaos() {
                if (!chaosEnabled() || !chaos.items.length) return;
                const w = aboutLayout.clientWidth || 1;
                const h = aboutLayout.clientHeight || 1;
                const mobile = window.innerWidth <= 700;
                const colW = mobile ? 48 : 68;
                const cols = Math.max(5, Math.floor(w / colW));
                const colX = (c) => (c + 0.5) * (w / cols);

                chaos.items.forEach((it, i) => {
                    const col = i % cols;
                    it.col = col;
                    const jitter = (Math.random() - 0.5) * (w / cols) * 0.4;
                    it.x = colX(col) + jitter - it.size / 2;
                    it.y = Math.random() * (h + it.size * 2) - it.size;
                    it.el.style.transform = 'translate3d(' + it.x.toFixed(1) + 'px,' + it.y.toFixed(1) + 'px,0) scale(var(--logo-scale, 1))';
                });
                saveChaosState();
            }

            function chaosStep(ts) {
                if (!chaos.active) return;
                if (!chaos.last) chaos.last = ts;
                const dt = Math.min((ts - chaos.last) / 1000, 0.05);
                chaos.last = ts;
                const w = aboutLayout.clientWidth || 1;
                const h = aboutLayout.clientHeight || 1;
                const mobile = window.innerWidth <= 700;
                const colW = mobile ? 48 : 68;
                const cols = Math.max(5, Math.floor(w / colW));
                const colX = (c) => (c + 0.5) * (w / cols);

                for (const it of chaos.items) {
                    it.y += it.speed * dt;
                    if (it.y > h + it.size) {
                        const jitter = (Math.random() - 0.5) * (w / cols) * 0.4;
                        it.col = Math.floor(Math.random() * cols);
                        it.x = colX(it.col) + jitter - it.size / 2;
                        it.y = -it.size - Math.random() * h * 0.35;
                        it.speed = 16 + Math.random() * 30;
                    }
                    it.el.style.transform = 'translate3d(' + it.x.toFixed(1) + 'px,' + it.y.toFixed(1) + 'px,0) scale(var(--logo-scale, 1))';
                }
                positionChaosTip();
                chaos.raf = requestAnimationFrame(chaosStep);
            }

            function startChaos() {
                if (!chaosEnabled() || chaos.active) return;
                const restored = buildChaos();
                if (!restored) layoutChaos();
                else if (chaos.items.length) {
                    chaos.items.forEach(it => {
                        it.el.style.transform = 'translate3d(' + it.x.toFixed(1) + 'px,' + it.y.toFixed(1) + 'px,0) scale(var(--logo-scale, 1))';
                    });
                }
                chaos.active = true;
                chaos.last = 0;
                chaosField.classList.add('active');
                if (!chaos.raf) chaos.raf = requestAnimationFrame(chaosStep);
            }

            function stopChaos() {
                chaos.active = false;
                hideChaosTip();
                if (chaos.raf) { cancelAnimationFrame(chaos.raf); chaos.raf = null; }
                if (chaosField) chaosField.classList.remove('active');
            }

            function syncChaos() {
                if (!chaosEnabled()) { stopChaos(); return; }
                if (activePage === 'about') startChaos();
                else stopChaos();
            }

            window.addEventListener('resize', () => {
                if (!chaos.built) return;
                if (chaos.builtCount !== chaosCount()) {
                    const wasActive = chaos.active;
                    stopChaos();
                    chaos.built = false;
                    chaos.builtCount = 0;
                    chaos.items = [];
                    if (chaosField) chaosField.innerHTML = '';
                    try { sessionStorage.removeItem(CHAOS_STATE_KEY); } catch (_) {}
                    if (wasActive) startChaos();
                } else {
                    layoutChaos();
                }
            });

            window.addEventListener('pagehide', saveChaosState);
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) saveChaosState();
            });

            /* ------------------------------------------------------------ local artwork fallback
               Cadangan gambar lokal kalau aset eksternal gagal dimuat.
               Local artwork fallback when an external asset fails to load. */

            document.getElementById('artwork')
                .addEventListener('error', event => {
                    const image = event.currentTarget;

                    if (image.dataset.fallback) return;

                    image.dataset.fallback = 'true';
                    image.src = 'assets/logos.jpg';
                });

            /* ------------------------------------------------------------ typewriter
               Teks interaktif di halaman home yang mengetik secara otomatis.
               Interactive typing text on the home page. */

            const typewriterPhrases = [
                "Exploring cyberspace.",
                "Securing the digital world.",
                "Building resilient systems.",
                "Testing. Learning. Advancing.",
                "Coding with purpose.",
                "Protecting what matters.",
                "ٱلْحَمْدُ لِلَّٰهِ. Alhamdulillah.",
                "Learning with purpose.",
                "Sharing for the benefit of others.",
                "Stay curious. Keep exploring.",
                "Thank you for being here."
            ];

            const subtitlePhrases = [
                "Try. Push. Improve.",
                "Learn. Build. Ship.",
                "Find. Fix. Share.",
                "Explore. Document. Grow.",
                "Secure. Harden. Repeat.",
                "ٱلْحَمْدُ لِلَّٰهِ. Alhamdulillah.",
                "Thanks for coming.",
                "May knowledge bring benefit.",
                "Enjoy the journey.",
                "بَارَكَ اللهُ فِيكَ. Barakallahu fiik."
            ];

            let typewriterTimer = null;
            let subtitleTimer = null;
            let typewriterState = {
                phraseIndex: 0,
                charIndex: 0,
                isDeleting: false
            };

            function startTypewriter() {
                const title = document.getElementById('homeTitle');
                if (!title) return;

                stopTypewriter();

                typewriterState = {
                    phraseIndex: 0,
                    charIndex: 0,
                    isDeleting: false
                };

                if (reducedMotion.matches) {
                    title.textContent = typewriterPhrases[0];
                    title.classList.add('typing');
                    typewriterTimer = setInterval(() => {
                        typewriterState.phraseIndex = (typewriterState.phraseIndex + 1) % typewriterPhrases.length;
                        title.textContent = typewriterPhrases[typewriterState.phraseIndex];
                    }, 3000);
                    return;
                }

                title.textContent = '';
                title.classList.add('typing');

                const tick = () => {
                    const phrase = typewriterPhrases[typewriterState.phraseIndex];

                    if (typewriterState.isDeleting) {
                        title.textContent = phrase.substring(0, typewriterState.charIndex);
                        typewriterState.charIndex--;
                    } else {
                        title.textContent = phrase.substring(0, typewriterState.charIndex + 1);
                        typewriterState.charIndex++;
                    }

                    let delay = 70;

                    if (!typewriterState.isDeleting && typewriterState.charIndex === phrase.length) {
                        delay = 1800;
                        typewriterState.isDeleting = true;
                    } else if (typewriterState.isDeleting && typewriterState.charIndex === 0) {
                        typewriterState.isDeleting = false;
                        typewriterState.phraseIndex = (typewriterState.phraseIndex + 1) % typewriterPhrases.length;
                        delay = 350;
                    } else if (typewriterState.isDeleting) {
                        delay = 35;
                    }

                    typewriterTimer = setTimeout(tick, delay);
                };

                typewriterTimer = setTimeout(tick, 500);
            }

            function startSubtitle() {
                const subtitle = document.querySelector('.home-copy p');
                if (!subtitle) return;

                if (subtitleTimer) {
                    clearInterval(subtitleTimer);
                }

                let index = 0;
                subtitle.textContent = subtitlePhrases[0];

                subtitleTimer = setInterval(() => {
                    index = (index + 1) % subtitlePhrases.length;
                    subtitle.style.opacity = '0';

                    setTimeout(() => {
                        subtitle.textContent = subtitlePhrases[index];
                        subtitle.style.opacity = '1';
                    }, 250);
                }, 3500);
            }

            function stopTypewriter() {
                if (typewriterTimer) {
                    clearTimeout(typewriterTimer);
                    typewriterTimer = null;
                }
                if (subtitleTimer) {
                    clearInterval(subtitleTimer);
                    subtitleTimer = null;
                }
                const title = document.getElementById('homeTitle');
                const subtitle = document.querySelector('.home-copy p');
                if (title) {
                    title.classList.remove('typing');
                }
                if (subtitle) {
                    subtitle.textContent = subtitlePhrases[0];
                    subtitle.style.opacity = '1';
                }
            }

            /* ------------------------------------------------------------ calm headings
               Animasi ketik santai untuk judul panel.
               Calm typing animation for panel headings. */

            let calmTimers = [];

            function stopCalmText() {
                calmTimers.forEach(timer => clearTimeout(timer));
                calmTimers = [];
            }

            function setCalmText(container = document) {
                const scope = container || document;
                const nodes = Array.from(scope.querySelectorAll('[data-calm-text]'));
                nodes.forEach((node) => {
                    const text = node.dataset.calmText || node.textContent || '';
                    if (!text) return;
                    node.textContent = text;
                    node.style.opacity = '';
                    node.style.transition = '';
                });
            }

            /* ------------------------------------------------------------ initial route
               Tentukan halaman awal dari hash dan pasang navigasi.
               Resolve the initial page from the hash and set up navigation. */

            function initialRoute() {
                var hash = (location.hash || '').replace('#', '');
                const target = hash === 'about' ? 'about' : hash === 'references' ? 'references' : 'home';

                Object.values(pages).forEach(page => {
                    page.hidden = page !== pages[target];
                    page.classList.remove('entering', 'leaving');
                });

                activePage = target;
                updateNavigation(target);

                pages[target].classList.add('entering');

                if (target === 'home') {
                    startTypewriter();
                    startSubtitle();
                }
                if (target === 'about') {
                    setCalmText(pages.about);
                    startChaos();
                }

                const activeTab = tabs[selectedPanel];
                if (activeTab) {
                    const activePanel = document.getElementById(activeTab.getAttribute('aria-controls'));
                    setCalmText(activePanel);
                }
            }

            initialRoute();
        })();
