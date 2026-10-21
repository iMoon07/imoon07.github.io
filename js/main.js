/* =============================================================================
   MESIN DAFTAR ARTIKEL / ARTICLE LISTING ENGINE
   Mengambil metadata artikel dari GitHub, menyaring, memaginasi, lalu
   menggambar kartu artikelnya.
   Fetches article metadata from GitHub, filters, paginates, then draws the
   article cards.

   Data sumber ada di js/data.js, markup di blog.html.
   Source data lives in js/data.js, markup in blog.html.
   ============================================================================= */
const FETCH_CONCURRENCY = 6;
const POSTS_PER_PAGE = 10;

const projectContainer = document.getElementById('project-container');
const catTitle = document.getElementById('cat-title');
const postCountEl = document.getElementById('post-count');
const paginationEl = document.getElementById('pagination');
const pageNumbersEl = document.getElementById('pageNumbers');
const pageIndicatorEl = document.getElementById('pageIndicator');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');

/* ---------------------------------------------------------------- state
   State bersama: token render, halaman aktif, jumlah halaman.
   Shared state: render token, active page, total pages. */
let renderToken = 0;
let currentPage = 1;
let totalPages = 1;

/* ---------------------------------------------------------------- project data
   Ambil metadata satu artikel: tanggal commit, bahasa, jumlah baca.
   Fetch one article metadata: commit date, language, reading time. */
async function fetchProjectData(project) {
    // STRICT: Skip project yang tidak punya id
    if (!project || !project.id || typeof project.id !== 'string' || project.id.trim() === '') {
        console.warn('Project di-skip (tidak punya id yang valid):', project);
        return project;
    }
    if (project.hasFetched) return project;
    project.hasFetched = true;

    const fetchSingle = async (url) => {
        if (!url) return null;

        // Timeout supaya request yang menggantung tidak membuat halaman kosong selamanya
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);

        try {
            const response = await fetch(url, { signal: controller.signal });
            const text = await response.text();
            
            const lastModified = response.headers.get('Last-Modified');
            let date = lastModified ? new Date(lastModified).getTime() : 0;

            let titleMatch = text.match(/<title>(.*?)<\/title>/i) || text.match(/^#\s+(.+)/m) || text.match(/<h1[^>]*>(.*?)<\/h1>/i);
            let title = titleMatch ? titleMatch[1].replace(/<[^>]*>?/gm, '').trim() : "Project Security";

            let body = text.replace(/^#.*$/gm, '');
            let paragraphs = body.match(/^[A-Za-z].*$/gm) || [];

            let descRaw = paragraphs
                .join(' ')
                .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Remove markdown links
                .replace(/<[^>]*>?/gm, '')  // Remove HTML tags
                .replace(/\*\*([^*]+)\*\*/g, '$1')  // Remove bold
                .replace(/\*([^*]+)\*/g, '$1')  // Remove italic
                .replace(/`([^`]+)`/g, '$1')  // Remove code
                .replace(/\s+/g, ' ')
                .trim();

            let desc = descRaw
                ? (descRaw.length > 240
                    ? descRaw.slice(0, 240).replace(/\s+\S*$/, '') + '…'
                    : descRaw)
                : "No description available.";

            return { title, desc, date, text };
        } catch (err) {
            return null;
        } finally {
            clearTimeout(timer);
        }
    };

    const idData = await fetchSingle(project.rawUrl);
    let derivedUrlEn = project.rawUrlEn || (project.rawUrl ? (project.rawUrl.endsWith('-id.md') ? project.rawUrl.replace('-id.md', '-en.md') : project.rawUrl.replace('.md', '-en.md')) : null);
    const enData = derivedUrlEn ? await fetchSingle(derivedUrlEn) : null;

    if (idData) {
        project.titleId = idData.title;
        project.descId = idData.desc;

        // Tanggal tampilan = publishedDate > lastEditedDate > tanggal file di GitHub
        const baseDate = project.publishedDate || project.lastEditedDate || (idData.date ? new Date(idData.date) : null);
        project.sortDate = baseDate ? new Date(baseDate).getTime() : 0;

        let formatterEn = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        project.displayDateEn = baseDate ? formatterEn.format(new Date(baseDate)) : "Unknown Date";
        let formatterId = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        project.displayDateId = baseDate ? formatterId.format(new Date(baseDate)) : "Tanggal Tidak Diketahui";

        
        let foundImgUrl = null;
        let allImages = [];
        const htmlImgRegex = /<img[^>]*src=["']([^"']+)["']/gi;
        let match;
        while ((match = htmlImgRegex.exec(idData.text)) !== null) { allImages.push(match[1]); }
        const mdImgRegex = /!\[[^\]]*\]\(([^)]+)\)/gi;
        while ((match = mdImgRegex.exec(idData.text)) !== null) { allImages.push(match[1]); }

        for (let img of allImages) {
            let lowerImg = img.toLowerCase();
            if (!lowerImg.includes('shields.io') && !lowerImg.includes('badge') && !lowerImg.includes('actions/workflows') && !lowerImg.includes('travis-ci')) {
                foundImgUrl = img;
                break;
            }
        }
        
        if (foundImgUrl && !foundImgUrl.startsWith('http')) {
            let basePath = project.rawUrl.substring(0, project.rawUrl.lastIndexOf('/') + 1);
            foundImgUrl = basePath + foundImgUrl;
        }
        
        const fallbackSvg = (txt) => `data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='300' viewBox='0 0 600 300'%3E%3Crect fill='%23161b22' width='600' height='300'/%3E%3Ctext fill='%23c9d1d9' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='24'%3E${encodeURIComponent(txt)}%3C/text%3E%3C/svg%3E`;
        project.image = foundImgUrl || fallbackSvg(project.titleId);
    } else {
        project.titleId = "Error";
        project.descId = "Failed to load.";
        project.sortDate = 0;
        project.displayDateEn = "Unknown Date";
        project.displayDateId = "Tanggal Tidak Diketahui";
        project.image = `data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='300' viewBox='0 0 600 300'%3E%3Crect fill='%23161b22' width='600' height='300'/%3E%3Ctext fill='%23c9d1d9' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='24'%3EError%3C/text%3E%3C/svg%3E`;
    }

    if (enData) {
        project.titleEn = enData.title;
        project.descEn = enData.desc;
    } else {
        project.titleEn = project.titleId;
        project.descEn = project.descId;
    }

    return project;
}

/* ---------------------------------------------------------------- card markup
   Bentuk markup kartu artikel dan rapikan nama kategori.
   Article card markup and readable category names. */
function formatCategory(category) {
    return String(category)
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function postCardHtml(project, index) {
    let isId = (window.currentLang === 'id');
    let title = isId ? project.titleId : project.titleEn;
    let desc = isId ? project.descId : project.descEn;
    let postUrl = `read.html?post=${project.id}${isId ? '' : '&lang=en'}`;

    let tagsHtml = '';
    if (project.tags && project.tags.length > 0) {
        tagsHtml = '<div class="post-tags">';
        project.tags.forEach(tag => {
            tagsHtml += `<span class="tag-badge" onclick="renderProjects('all', '${tag}')">${tag}</span>`;
        });
        tagsHtml += '</div>';
    }

    // Post pertama jadi lead (gambar lebih besar), post lain memakai layout yang sama
    let postClass = index === 0 ? 'post-item post-lead' : 'post-item';

    return `
        <article class="${postClass}">
            <a class="post-media" href="${postUrl}" tabindex="-1" aria-hidden="true">
                <img src="${project.image}" alt="" loading="lazy" onerror="this.onerror=null; this.src='data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'600\\' height=\\'300\\' viewBox=\\'0 0 600 300\\'%3E%3Crect fill=\\'%23161b22\\' width=\\'600\\' height=\\'300\\'/%3E%3Ctext fill=\\'%23c9d1d9\\' x=\\'50%25\\' y=\\'50%25\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' font-family=\\'sans-serif\\' font-size=\\'24\\'%3ENo Image%3C/text%3E%3C/svg%3E'">
            </a>

            <div class="post-body">
                <div class="post-meta">
                    <span class="post-date">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        ${isId ? project.displayDateId : project.displayDateEn}
                    </span>

                    ${tagsHtml}
                </div>

                <h2 class="post-title">
                    <a href="${postUrl}">${title}</a>
                </h2>

                <p class="post-desc">${desc}</p>

                <a class="post-more" href="${postUrl}">
                    ${isId ? "Baca Selanjutnya" : "Continue Reading"}
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
                </a>
            </div>
        </article>
    `;
}

// Jalankan task dengan batas konkurensi supaya tidak membanjiri jaringan
/* ---------------------------------------------------------------- helpers
   Batas konkurensi request, tanggal artikel, dan urutan.
   Request concurrency limit, article date, and ordering. */
async function mapLimit(items, limit, worker) {
    let index = 0;

    async function runner() {
        while (index < items.length) {
            const current = index++;
            await worker(items[current]);
        }
    }

    const runners = [];
    const count = Math.min(limit, items.length);
    for (let i = 0; i < count; i++) runners.push(runner());
    await Promise.all(runners);
}

// Tanggal acuan sebuah post: publishedDate > lastEditedDate > tanggal file di GitHub
function postDate(project) {
    if (project.publishedDate) {
        const published = new Date(project.publishedDate).getTime();
        if (!isNaN(published)) return published;
    }
    if (project.lastEditedDate) {
        const edited = new Date(project.lastEditedDate).getTime();
        if (!isNaN(edited)) return edited;
    }
    return project.sortDate || 0;
}

// Urut dari post terbaru ke yang terlama
function sortByNewest(list) {
    return list.sort((a, b) => {
        const diff = postDate(b) - postDate(a);
        if (diff !== 0) return diff;
        return String(a.id).localeCompare(String(b.id));
    });
}

// Daftar nomor halaman: 1, …, [current-1, current, current+1], …, total
/* ---------------------------------------------------------------- pagination
   Susun nomor halaman, gambar tombol, dan pindah halaman.
   Build the page numbers, draw the buttons, and change page. */
function pageRange(current, total) {
    const pages = [];
    const window = [];

    for (let p = Math.max(1, current - 1); p <= Math.min(total, current + 1); p++) {
        window.push(p);
    }

    pages.push(1);
    if (window[0] > 2) pages.push('…');
    window.forEach(p => {
        if (p !== 1) pages.push(p);
    });
    if (window[window.length - 1] < total - 1) pages.push('…');
    if (total > 1 && !window.includes(total)) pages.push(total);

    return pages;
}

function renderPagination() {
    if (!paginationEl || !pageNumbersEl) return;

    paginationEl.hidden = totalPages <= 1;

    if (totalPages <= 1) {
        pageNumbersEl.innerHTML = '';
        return;
    }

    pageNumbersEl.innerHTML = '';

    pageRange(currentPage, totalPages).forEach(page => {
        if (page === '…') {
            const gap = document.createElement('span');
            gap.className = 'page-ellipsis';
            gap.textContent = '…';
            gap.setAttribute('aria-hidden', 'true');
            pageNumbersEl.appendChild(gap);
            return;
        }

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'page-number' + (page === currentPage ? ' is-active' : '');
        button.textContent = page;
        button.setAttribute('aria-label', `Page ${page}`);
        if (page === currentPage) button.setAttribute('aria-current', 'page');
        button.addEventListener('click', () => goToPage(page));
        pageNumbersEl.appendChild(button);
    });

    if (pageIndicatorEl) {
        pageIndicatorEl.textContent =
            `PAGE ${String(currentPage).padStart(3, '0')} / ${String(totalPages).padStart(3, '0')}`;
    }

    if (prevPageBtn) prevPageBtn.disabled = currentPage === 1;
    if (nextPageBtn) nextPageBtn.disabled = currentPage === totalPages;
}

function updatePostCount(total) {
    if (!postCountEl) return;
    const label = total === 1 ? 'article' : 'articles';
    postCountEl.textContent = `${total.toLocaleString('en-US')} ${label}`;
}

function goToPage(page) {
    if (page < 1 || page > totalPages || page === currentPage) return;

    // Scroll balik ke daftar artikel supaya halaman baru langsung terlihat
    const list = document.getElementById('project-container');
    if (list) {
        const top = list.getBoundingClientRect().top + window.scrollY - 24;
        window.scrollTo({ top: top, behavior: 'smooth' });
    }

    renderProjects(window.currentCategory, window.currentTag, page);
}

/* ---------------------------------------------------------------- render list
   Ambil data halaman ini, saring, lalu gambar daftar artikel.
   Fetch this page data, filter it, then draw the article list. */
async function renderProjects(initialCategory, initialTag = null, page = 1) {
    const token = ++renderToken;
    let isId = (window.currentLang === 'id');
    window.currentCategory = initialCategory;
    window.currentTag = initialTag;

    // Update category title
    if (initialTag) catTitle.innerText = `Tag: ${initialTag}`;
    else if (initialCategory && initialCategory !== 'all') catTitle.innerText = formatCategory(initialCategory);
    else catTitle.innerText = "Latest posts";

    updateFilterState(initialCategory, initialTag);

    // Tabel filter digambar ulang supaya item aktif tetap terlihat di posisi yang benar
    renderCategories();
    renderTags();

    let list = myProjects.slice();

    // Filter by category
    if (initialCategory !== 'all') {
        list = list.filter(project =>
            project.category && String(project.category).trim().toLowerCase() === initialCategory
        );
    }

    // Filter by tag
    if (initialTag) {
        list = list.filter(project =>
            project.tags && project.tags.some(t => t.toLowerCase() === initialTag.toLowerCase())
        );
    }

    // Urut dari post terbaru ke yang terlama (metadata sudah cukup, tanpa fetch)
    sortByNewest(list);

    // Pagination
    totalPages = Math.max(1, Math.ceil(list.length / POSTS_PER_PAGE));
    currentPage = Math.min(Math.max(1, page), totalPages);
    updatePostCount(list.length);
    renderPagination();

    if (list.length === 0) {
        let noDataText = isId ? "Belum ada tulisan di kategori/tag ini." : "No articles found for this category/tag.";
        projectContainer.innerHTML = `<p><i>${noDataText}</i></p>`;
        return;
    }

    const start = (currentPage - 1) * POSTS_PER_PAGE;
    const pageItems = list.slice(start, start + POSTS_PER_PAGE);

    // Placeholder tanpa teks "loading" selama data halaman ini diambil
    projectContainer.innerHTML = `
        <div class="post-skeleton" aria-hidden="true">
            <div class="skeleton-media"></div>
            <div class="skeleton-body">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>`;

    // Hanya data halaman ini yang diambil, jadi tetap ringan walau artikelnya banyak
    await mapLimit(pageItems, FETCH_CONCURRENCY, project => fetchProjectData(project));
    if (token !== renderToken) return;

    projectContainer.innerHTML = pageItems.map((project, index) => postCardHtml(project, index)).join('');
}

/* ---------------------------------------------------------------- filters
   Filter kategori dan tag, plus menu "+N" untuk sisanya.
   Category and tag filters, plus the "+N" menu for the rest. */
function updateFilterState(category, tag) {
    document.querySelectorAll('.blog-tab[data-cat]').forEach(tab => {
        const active = !tag && tab.dataset.cat === category;
        tab.classList.toggle('is-active', active);
    });

    document.querySelectorAll('.blog-tab[data-tag]').forEach(tab => {
        const current = tag || '';
        tab.classList.toggle('is-active', tab.dataset.tag === current);
    });

    document.querySelectorAll('.filter-menu-item[data-cat]').forEach(item => {
        item.classList.toggle('is-active', !tag && item.dataset.cat === category);
    });

    document.querySelectorAll('.filter-menu-item[data-tag]').forEach(item => {
        item.classList.toggle('is-active', (tag || '') === item.dataset.tag);
    });
}

// Jumlah filter yang tampil sebelum sisanya masuk ke menu "+N"
function filterLimit() {
    return window.innerWidth < 700 ? 3 : 5;
}

// Bagi daftar filter: yang tampil langsung, sisanya disembunyikan di menu dropdown
function splitFilters(items) {
    const limit = filterLimit();
    const visible = items.slice(0, limit);
    let hidden = items.slice(limit);

    // Filter yang sedang aktif harus tetap kelihatan, walau posisinya di belakang
    const activeInHidden = hidden.find(item => item.active);
    if (activeInHidden) {
        hidden = hidden.filter(item => item !== activeInHidden);
        const replaceAt = visible.map(item => item.active).lastIndexOf(false);
        if (replaceAt !== -1) visible[replaceAt] = activeInHidden;
    }

    return { visible, hidden };
}

function closeFilterMenus() {
    document.querySelectorAll('.filter-menu').forEach(menu => {
        menu.hidden = true;
    });
    document.querySelectorAll('.filter-more').forEach(btn => {
        btn.setAttribute('aria-expanded', 'false');
    });
}

function buildFilterMenu(items) {
    const wrap = document.createElement('span');
    wrap.className = 'filter-more-wrap';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'filter-more';
    button.textContent = `+${items.length}`;
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', 'Show more filters');

    const menu = document.createElement('div');
    menu.className = 'filter-menu';
    menu.hidden = true;

    items.forEach(item => {
        const link = document.createElement('a');
        link.href = '#';
        link.className = 'filter-menu-item' + (item.active ? ' is-active' : '');
        link.textContent = item.label;
        if (item.dataset) {
            Object.keys(item.dataset).forEach(key => {
                link.setAttribute(`data-${key}`, item.dataset[key]);
            });
        }
        link.addEventListener('click', event => {
            event.preventDefault();
            closeFilterMenus();
            item.onClick();
        });
        menu.appendChild(link);
    });

    button.addEventListener('click', event => {
        event.stopPropagation();
        const open = menu.hidden;
        closeFilterMenus();
        menu.hidden = !open;
        button.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    wrap.appendChild(button);
    wrap.appendChild(menu);
    return wrap;
}

// Render satu baris filter: beberapa item langsung, sisanya di dropdown
function renderFilterGroup(container, items) {
    if (!container) return;

    container.innerHTML = '';
    const { visible, hidden } = splitFilters(items);

    visible.forEach(item => {
        const link = document.createElement('a');
        link.href = '#';
        link.className = 'blog-tab' + (item.active ? ' is-active' : '');
        link.textContent = item.label;
        if (item.dataset) {
            Object.keys(item.dataset).forEach(key => {
                link.setAttribute(`data-${key}`, item.dataset[key]);
            });
        }
        link.addEventListener('click', event => {
            event.preventDefault();
            item.onClick();
        });
        container.appendChild(link);
    });

    if (hidden.length) {
        container.appendChild(buildFilterMenu(hidden));
    }
}

/* ---------------------------------------------------------------- filter groups
   Gambar baris filter kategori dan tag beserta status aktif.
   Draw the category and tag filter rows with their active state. */
function renderCategories() {
    const catNav = document.getElementById('cat-nav-container');
    if (!catNav) return;

    // Collect every category used by the projects
    const allCategories = new Set();
    myProjects.forEach(project => {
        if (project.category) {
            allCategories.add(String(project.category).trim().toLowerCase());
        }
    });

    const sortedCategories = Array.from(allCategories).sort();

    const items = [{
        label: 'All posts',
        active: !window.currentTag && (!window.currentCategory || window.currentCategory === 'all'),
        dataset: { cat: 'all' },
        onClick: () => renderProjects('all')
    }];

    sortedCategories.forEach(category => {
        items.push({
            label: formatCategory(category),
            active: !window.currentTag && window.currentCategory === category,
            dataset: { cat: category },
            onClick: () => renderProjects(category)
        });
    });

    renderFilterGroup(catNav, items);
}

function renderTags() {
    const tagNav = document.getElementById('tag-nav-container');
    if (!tagNav) return;

    // Collect all unique tags
    const allTags = new Set();
    myProjects.forEach(project => {
        if (project.tags) {
            project.tags.forEach(tag => allTags.add(tag));
        }
    });

    // Sort tags alphabetically
    const sortedTags = Array.from(allTags).sort();

    const items = [{
        label: 'All',
        active: !window.currentTag,
        dataset: { tag: '' },
        onClick: () => renderTagsClear()
    }];

    sortedTags.forEach(tag => {
        items.push({
            label: `#${tag}`,
            active: window.currentTag === tag,
            dataset: { tag: tag },
            onClick: () => renderProjects('all', tag)
        });
    });

    renderFilterGroup(tagNav, items);
}

function renderTagsClear() {
    closeFilterMenus();
    renderProjects('all', null);
}

/* ---------------------------------------------------------------- start
   Pasang tombol halaman, muat data, lalu render pertama.
   Hook up the page buttons, load the data, then render the first page. */
async function initEngine() {
    // Tabs kategori & tag langsung muncul dari metadata, tanpa perlu fetch
    renderCategories();
    renderTags();

    await renderProjects('all');
}

// Tombol previous / next
if (prevPageBtn) {
    prevPageBtn.addEventListener('click', () => goToPage(currentPage - 1));
}

if (nextPageBtn) {
    nextPageBtn.addEventListener('click', () => goToPage(currentPage + 1));
}

// Tutup dropdown filter saat klik di luar
document.addEventListener('click', closeFilterMenus);
document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeFilterMenus();
});

// Jumlah filter yang tampil menyesuaikan lebar layar
let resizeTimer = null;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        renderCategories();
        renderTags();
    }, 200);
});

// Initialize application
window.blogReady = initEngine();
