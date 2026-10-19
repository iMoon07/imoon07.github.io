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

            window.addEventListener('hashchange', () => {
                showPage(
                    location.hash === '#about'
                        ? 'about'
                        : 'home'
                );
            });

            /* ABOUT SLIDER */

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

            /* EXPERIENCE DETAILS */

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

            /* TOUCH SWIPE */

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

            /* PORTRAIT CURTAIN */

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

            /* LOCAL ARTWORK FALLBACK */

            document.getElementById('artwork')
                .addEventListener('error', event => {
                    const image = event.currentTarget;

                    if (image.dataset.fallback) return;

                    image.dataset.fallback = 'true';
                    image.src = 'assets/logos.jpg';
                });

            /* INITIAL ROUTE */

            if (location.hash === '#about') {
                showPage('about', false);
            }
        })();
