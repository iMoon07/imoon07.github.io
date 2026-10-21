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
                about: document.getElementById('aboutPage')
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

                window.scrollTo({
                    top: 0,
                    behavior: 'auto'
                });

                if (focusTarget) {
                    const target = name === 'about'
                        ? document.querySelector(
                            '.tab[aria-selected="true"]'
                        )
                        : document.getElementById('homeTitle');

if (name === 'home') {
                    target.setAttribute('tabindex', '-1');
                    startTypewriter();
                    startSubtitle();
                } else {
                    stopTypewriter();
                }

                target.focus({ preventScroll: true });
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
                showPage(
                    location.hash === '#about'
                        ? 'about'
                        : 'home'
                );
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
                lpro: document.getElementById('lproDetail')
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
                        showExperience('list');

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
                codingceria: document.getElementById('codingceriaDetail')
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
            const photoToggle = document.getElementById('photoToggle');

            photoToggle.addEventListener('click', () => {
                const covered =
                    portrait.classList.toggle('covered');

                photoToggle.textContent =
                    covered ? 'Show photo' : 'Hide photo';

                photoToggle.setAttribute(
                    'aria-label',
                    covered
                        ? 'Show profile photo'
                        : 'Hide profile photo'
                );
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
                "Alhamdulillah.",
                "Learning with purpose.",
                "Sharing for the benefit of others.",
                "Stay curious. Keep exploring.",
                "Thank you for being here.",
                "Assalamu’alaikum."
            ];

            const subtitlePhrases = [
                "Try. Push. Improve.",
                "Learn. Build. Ship.",
                "Find. Fix. Share.",
                "Explore. Document. Grow.",
                "Secure. Harden. Repeat.",
                "All praise be to Allah.",
                "May knowledge bring benefit.",
                "Enjoy the journey.",
                "Thank you for visiting."
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

                    let delay = 100;

                    if (!typewriterState.isDeleting && typewriterState.charIndex === phrase.length) {
                        delay = 2000;
                        typewriterState.isDeleting = true;
                    } else if (typewriterState.isDeleting && typewriterState.charIndex === 0) {
                        typewriterState.isDeleting = false;
                        typewriterState.phraseIndex = (typewriterState.phraseIndex + 1) % typewriterPhrases.length;
                        delay = 500;
                    } else if (typewriterState.isDeleting) {
                        delay = 50;
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
                }, 4000);
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

            /* ------------------------------------------------------------ initial route
               Tentukan halaman awal dari hash dan pasang navigasi.
               Resolve the initial page from the hash and set up navigation. */

            function initialRoute() {
                const target = location.hash === '#about' ? 'about' : 'home';

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
            }

            initialRoute();
        })();
