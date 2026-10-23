/* =============================================================================
   READER ARTIKEL / ARTICLE READER
   Ambil markdown, render jadi HTML, lalu pasang interaksi: TOC, lightbox,
   video, giscus, dan progress bar.
   Fetches markdown, renders it to HTML, then wires the interactions: TOC,
   lightbox, video, giscus, and the reading progress bar.

   Markup ada di read.html, data artikel di js/data.js, extension markdown
   di js/markdown.js. Berkas ini tidak mengubah isi markdown sumber.
   Markup lives in read.html, article data in js/data.js, markdown extensions
   in js/markdown.js. This file never rewrites the source markdown.
   ============================================================================= */

const urlParams = new URLSearchParams(window.location.search);
let postId = urlParams.get('post');
const lang = urlParams.get('lang') || 'id';

if (!postId && window.location.pathname.endsWith('about.html')) {
    postId = 'about-me';
}

let repoUrl = urlParams.get('url');
let currentProject = null;

const ARTICLE_LANG = lang;
const HLJS_BASE = 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.11.1';

const el = {
    content: document.getElementById('content'),
    title: document.getElementById('article-title'),
    lede: document.getElementById('article-lede'),
    meta: document.getElementById('article-meta'),
    tags: document.getElementById('article-tags'),
    category: document.getElementById('article-category'),
    toc: document.getElementById('toc-list'),
    tocMobile: document.getElementById('toc-list-mobile'),
    tocAside: document.getElementById('article-toc'),
    tocToggle: document.getElementById('toc-toggle'),
    tocClose: document.getElementById('toc-close'),
    tocMeter: document.getElementById('toc-meter-fill'),
    tocMeterMobile: document.getElementById('toc-meter-fill-mobile'),
    tocPercent: document.getElementById('toc-percent'),
    tocPercentMobile: document.getElementById('toc-percent-mobile'),
    drawer: document.getElementById('toc-drawer'),
    progress: document.getElementById('reading-progress-bar'),
    nav: document.getElementById('article-nav'),
    related: document.getElementById('related-list'),
    relatedBox: document.getElementById('article-related')
};

/* ---------------------------------------------------------------- utilities
   Pembantu umum: escape HTML, format tanggal, ikon, nama rapi.
   Shared helpers: HTML escaping, date formatting, icons, readable names. */

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function slugify(text) {
    return String(text)
        .toLowerCase()
        .trim()
        .replace(/[^\p{L}\p{N}\s-]/gu, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 80) || 'section';
}

function humanize(id) {
    return String(id)
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, letter => letter.toUpperCase());
}

function formatDate(value) {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(ARTICLE_LANG === 'en' ? 'en-GB' : 'id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    }).format(date);
}

function readTime(text) {
    const words = String(text).trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.round(words / 200));
    return ARTICLE_LANG === 'en' ? `${minutes} min read` : `${minutes} menit baca`;
}

function icon(name) {
    const paths = {
        arrowRight: '<path d="M5 12h14M12 5l7 7-7 7"></path>',
        calendar: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>',
        clock: '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>',
        copy: '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>',
        check: '<polyline points="20 6 9 17 4 12"></polyline>',
        wrap: '<polyline points="16 3 21 3 21 8"></polyline><path d="M21 3 10 14"></path><path d="M21 12v5a4 4 0 0 1-4 4H7"></path><path d="M3 7h6"></path><path d="M3 12h9"></path>',
        note: '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>',
        tip: '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"></path>',
        warning: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>',
        danger: '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>'
    };
    return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || ''}</svg>`;
}

/* ---------------------------------------------------------------- git history
   Riwayat commit dari GitHub API untuk tanggal dan tautan commit.
   Commit history from the GitHub API for the update date and the commit link. */

function sourcePaths(project) {
    if (!project || !project.rawUrl) return null;
    const match = project.rawUrl.match(/^https?:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/);
    if (!match) return null;
    return { owner: match[1], repo: match[2], ref: match[3], path: match[4] };
}

/**
 * Riwayat asli file di GitHub: commit terakhir (dan yang paling awal).
 * Dipakai supaya tanggal "diperbarui" bukan karangan, tapi facts.
 */
async function fetchGitHistory(project) {
    const info = sourcePaths(project);
    if (!info) return null;

    const api = `https://api.github.com/repos/${info.owner}/${info.repo}/commits?path=${encodeURIComponent(info.path)}&per_page=1`;
    const headers = { Accept: 'application/vnd.github+json' };

    let response;
    try {
        response = await fetch(api, { headers });
    } catch (error) {
        return null;
    }

    if (!response.ok) return null;

    const commits = await response.json();
    if (!Array.isArray(commits) || !commits.length) return null;

    const last = commits[0];
    const history = {
        lastDate: last.commit.author.date,
        lastSha: last.sha,
        lastUrl: last.html_url
    };

    // Commit paling lama: halaman terakhir dari header Link
    const link = response.headers.get('Link') || '';
    const lastPage = (link.match(/[?&]page=(\d+)>;\s*rel="last"/) || [])[1];

    if (lastPage && Number(lastPage) > 1) {
        try {
            const firstResponse = await fetch(`${api}&page=${lastPage}`, { headers });
            if (firstResponse.ok) {
                const oldest = await firstResponse.json();
                if (Array.isArray(oldest) && oldest.length) {
                    history.firstDate = oldest[oldest.length - 1].commit.author.date;
                }
            }
        } catch (error) {
            // history terakhir sudah cukup
        }
    } else {
        // Hanya satu commit, jadi commit pertama = commit terakhir
        history.firstDate = history.lastDate;
    }

    return history;
}

function applyGitHistory(history) {
    if (!history) return;

    const label = ARTICLE_LANG === 'en' ? 'Updated' : 'Diperbarui';
    const publishedNode = document.getElementById('article-published');
    const updatedNode = document.getElementById('article-updated');

    // Tanggal publish: pakai commit pertama kalau tidak diisi manual
    if (publishedNode && publishedNode.hidden && history.firstDate) {
        articleDates.published = history.firstDate;
        publishedNode.innerHTML = `${icon('calendar')}${escapeHtml(formatDate(history.firstDate))}`;
        publishedNode.hidden = false;
    }

    if (!updatedNode || !history.lastDate) return;

    articleDates.updated = history.lastDate;
    updatedNode.innerHTML = `${icon('calendar')}<span>${escapeHtml(`${label} ${formatDate(history.lastDate)}`)}</span>`;

    if (history.lastUrl && history.lastSha) {
        const link = document.createElement('a');
        link.className = 'article-commit';
        link.href = history.lastUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = history.lastSha.slice(0, 7);
        link.title = ARTICLE_LANG === 'en' ? 'View the commit on GitHub' : 'Lihat commit di GitHub';
        updatedNode.appendChild(link);
    }

    // Kalau tanggalnya sama, tidak perlu baris "diperbarui"
    updatedNode.hidden = Boolean(articleDates.published)
        && formatDate(articleDates.published) === formatDate(history.lastDate);
}

/* ---------------------------------------------------------------- meta
   Metadata artikel: judul, tanggal, kategori, tag, waktu baca, cover.
   Article metadata: title, dates, category, tags, reading time, cover. */

const GITHUB_PROFILE = 'https://github.com/iMoon07';

/**
 * Repository tempat catatan ini hidup.
 * Memakai repoUrl dari data kalau ada. Kalau tidak, diturunkan dari rawUrl
 * sehingga always mengarah ke repo catatan, bukan ke raw file.
 */
function parseGitHubUrl(url) {
    const match = String(url).match(/^https?:\/\/github\.com\/([^/?#]+)\/([^/?#]+)(?:\/tree\/[^/]+\/(.*?))?\/?$/);
    if (!match) return null;
    return { owner: match[1], repo: match[2], folder: match[3] || '' };
}

function projectRepo(project) {
    if (!project) return null;

    if (project.repoUrl) {
        const parsed = parseGitHubUrl(project.repoUrl);
        if (parsed) {
            return {
                url: project.repoUrl,
                name: parsed.repo,
                owner: parsed.owner,
                repo: parsed.repo,
                folder: parsed.folder
            };
        }

        const name = String(project.repoUrl).replace(/^https?:\/\/[^/]+\//, '').replace(/\/+$/, '');
        return { url: project.repoUrl, name, owner: '', repo: name, folder: '' };
    }

    if (project.rawUrl && project.rawUrl.includes('raw.githubusercontent.com')) {
        const parts = project.rawUrl.replace('https://raw.githubusercontent.com/', '').split('/');
        const owner = parts[0];
        const repo = parts[1];
        const folder = parts.slice(3, -1).join('/');

        return {
            url: folder
                ? `https://github.com/${owner}/${repo}/tree/main/${folder}`
                : `https://github.com/${owner}/${repo}`,
            name: repo,
            owner,
            repo,
            folder
        };
    }

    return null;
}

const articleDates = { published: null, updated: null };

function buildMeta(project, text, updatedDate) {
    if (el.meta) {
        const parts = [];

        parts.push(`<a class="article-author" href="${GITHUB_PROFILE}" target="_blank" rel="noopener noreferrer" aria-label="Raja Muhammad Kurnia Setyawan di GitHub">
            <img src="assets/foto-raja.jpg" alt="" width="34" height="34">
            <div>
                <strong>Raja Muhammad Kurnia Setyawan</strong>
                <span>@iMoon07</span>
            </div>
        </a>`);

        const published = project && project.publishedDate;
        const updated = updatedDate || (project && project.lastEditedDate);
        const label = ARTICLE_LANG === 'en' ? 'Updated' : 'Diperbarui';

        articleDates.published = published || null;
        articleDates.updated = updated || null;

        // Tanpa publishedDate manual, tanggal publish diambil dari commit pertama
        parts.push(`<span class="article-meta-item" id="article-published"${published ? '' : ' hidden'}>${icon('calendar')}${escapeHtml(formatDate(published))}</span>`);

        parts.push(`<span class="article-meta-item">${icon('clock')}${escapeHtml(readTime(text))}</span>`);

        const showUpdated = updated && (!published || updated !== published);
        const updatedText = updated ? `${label} ${formatDate(updated)}` : label;
        parts.push(`<span class="article-meta-item" id="article-updated"${showUpdated ? '' : ' hidden'}>${icon('calendar')}<span>${escapeHtml(updatedText)}</span></span>`);

        el.meta.innerHTML = parts.join('');
    }

    if (el.category && project && project.category) {
        el.category.textContent = humanize(project.category);
    }

    if (el.tags && project && project.tags && project.tags.length) {
        el.tags.innerHTML = project.tags
            .map(tag => `<a class="article-tag" href="blog.html?tag=${encodeURIComponent(tag)}">#${escapeHtml(tag)}</a>`)
            .join('');
    }
}

/* ---------------------------------------------------------------- code rendering
   Blok kode: bungkus baris nomor dan tombol copy, lalu syntax highlight.
   Code blocks: wrap with line numbers and a copy button, then apply syntax highlighting. */

const loadedLanguages = new Set();
let hljsReady = null;

function loadScript(src) {
    return new Promise(resolve => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.head.appendChild(script);
    });
}

function ensureHljs() {
    if (window.hljs) return Promise.resolve(true);
    if (!hljsReady) {
        hljsReady = loadScript(`${HLJS_BASE}/build/highlight.min.js`).then(() => !!window.hljs);
    }
    return hljsReady;
}

function normaliseLanguage(info) {
    if (!info) return '';
    const first = String(info).trim().split(/[\s:{]+/)[0];
    return first.toLowerCase().replace(/[^a-z0-9#+._-]/g, '');
}

function languageFileName(language) {
    const special = {
        'c++': 'cpp',
        'c#': 'csharp',
        'objective-c': 'objectivec',
        'shell': 'bash',
        'sh': 'bash',
        'zsh': 'bash',
        'console': 'shell',
        'terminal': 'shell',
        'bash-session': 'shell',
        'text': 'plaintext',
        'plain': 'plaintext',
        'txt': 'plaintext',
        'html': 'xml',
        'xml': 'xml',
        'vue': 'xml',
        'jsx': 'javascript',
        'ts': 'typescript',
        'js': 'javascript',
        'yml': 'yaml',
        'md': 'markdown',
        'py': 'python',
        'rb': 'ruby',
        'golang': 'go',
        'rs': 'rust',
        'kt': 'kotlin',
        'jsonc': 'json',
        'dotenv': 'ini',
        'env': 'ini',
        'properties': 'ini',
        'postgres': 'pgsql',
        'postgresql': 'pgsql'
    };
    return special[language] || language;
}

async function resolveLanguage(language) {
    if (!language) return '';

    await ensureHljs();
    if (!window.hljs) return '';
    if (window.hljs.getLanguage(language)) return language;

    const file = languageFileName(language);
    if (!file) return '';

    if (!loadedLanguages.has(file)) {
        loadedLanguages.add(file);
        const ok = await loadScript(`${HLJS_BASE}/build/languages/${file}.min.js`);
        if (!ok) return '';
    }

    return window.hljs.getLanguage(language) ? language : '';
}

function openTag(element) {
    let tag = '<' + element.tagName.toLowerCase();
    Array.from(element.attributes).forEach(attr => {
        tag += ` ${attr.name}="${escapeHtml(attr.value)}"`;
    });
    return tag + '>';
}

/**
 * Split highlighted markup into one HTML string per source line.
 * A token that spans several lines is re-opened on every line, so the
 * result is identical to the original while each line stays addressable.
 */
function splitHighlightedLines(html) {
    const holder = document.createElement('div');
    holder.innerHTML = html;

    const lines = [];
    let tokens = [];
    const stack = [];

    function flush() {
        lines.push(tokens);
        tokens = [];
    }

    function walk(node) {
        Array.from(node.childNodes).forEach(child => {
            if (child.nodeType === Node.TEXT_NODE) {
                const parts = child.textContent.split('\n');
                parts.forEach((part, index) => {
                    if (index > 0) flush();
                    if (part !== '') tokens.push({ text: part, stack: stack.slice() });
                });
                return;
            }
            if (child.nodeType !== Node.ELEMENT_NODE) return;
            stack.push(child);
            walk(child);
            stack.pop();
        });
    }

    walk(holder);
    flush();

    return lines.map(lineTokens => {
        let out = '';
        let open = [];

        lineTokens.forEach(token => {
            const want = token.stack;
            let common = 0;
            while (common < want.length && common < open.length && want[common] === open[common]) common++;

            for (let i = open.length; i > common; i--) {
                out += `</${open[i - 1].tagName.toLowerCase()}>`;
            }
            for (let i = common; i < want.length; i++) {
                out += openTag(want[i]);
            }

            open = want.slice();
            out += escapeHtml(token.text);
        });

        for (let i = open.length; i > 0; i--) {
            out += `</${open[i - 1].tagName.toLowerCase()}>`;
        }

        return out;
    });
}

function buildCodeBlock(pre, blockIndex) {
    const code = pre.querySelector('code');
    if (!code) return null;

    const raw = code.textContent.replace(/\n$/, '');
    const language = normaliseLanguage(code.className.replace('language-', '').trim());

    // Diagram mermaid dirender sendiri, bukan sebagai code block
    if (language === 'mermaid') {
        const diagram = document.createElement('div');
        diagram.className = 'mermaid-block';
        diagram.dataset.source = raw;
        diagram.textContent = raw;
        pre.replaceWith(diagram);
        return null;
    }

    const block = document.createElement('div');
    block.className = 'code-block';
    block.dataset.lang = language || 'text';

    const head = document.createElement('div');
    head.className = 'code-head';

    const langLabel = document.createElement('span');
    langLabel.className = 'code-lang';
    langLabel.textContent = language || 'text';
    head.appendChild(langLabel);

    const actions = document.createElement('div');
    actions.className = 'code-actions';

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'code-btn code-copy';
    copyBtn.innerHTML = `${icon('copy')}<span>Copy</span>`;
    copyBtn.setAttribute('aria-label', 'Copy code to clipboard');

    const wrapBtn = document.createElement('button');
    wrapBtn.type = 'button';
    wrapBtn.className = 'code-btn code-wrap-btn';
    wrapBtn.innerHTML = `${icon('wrap')}<span>Wrap</span>`;
    wrapBtn.setAttribute('aria-label', 'Toggle line wrapping');

    actions.appendChild(copyBtn);
    actions.appendChild(wrapBtn);
    head.appendChild(actions);

    const scroll = document.createElement('div');
    scroll.className = 'code-scroll';

    const newPre = document.createElement('pre');
    const newCode = document.createElement('code');
    if (language) newCode.className = `language-${language}`;
    newPre.appendChild(newCode);
    scroll.appendChild(newPre);

    block.appendChild(head);
    block.appendChild(scroll);

    const lineCount = raw.split('\n').length;
    if (lineCount > 40) {
        block.classList.add('is-collapsed');
        const expand = document.createElement('button');
        expand.type = 'button';
        expand.className = 'code-expand';
        expand.textContent = `Show all ${lineCount} lines`;
        expand.addEventListener('click', () => {
            const collapsed = block.classList.toggle('is-collapsed');
            expand.textContent = collapsed ? `Show all ${lineCount} lines` : 'Collapse code';
        });
        block.appendChild(expand);
    }

    copyBtn.addEventListener('click', async () => {
        const text = Array.from(newCode.querySelectorAll('.code-txt'))
            .map(node => node.textContent)
            .join('\n');

        const done = () => {
            copyBtn.classList.add('is-done');
            copyBtn.innerHTML = `${icon('check')}<span>Copied</span>`;
            setTimeout(() => {
                copyBtn.classList.remove('is-done');
                copyBtn.innerHTML = `${icon('copy')}<span>Copy</span>`;
            }, 1800);
        };

        const copied = await copyText(text);

        if (copied) {
            done();
        } else {
            copyBtn.innerHTML = '<span>Failed</span>';
            setTimeout(() => {
                copyBtn.innerHTML = `${icon('copy')}<span>Copy</span>`;
            }, 1800);
        }
    });

    wrapBtn.addEventListener('click', () => {
        const wrapped = block.classList.toggle('is-wrapped');
        wrapBtn.classList.toggle('is-done', wrapped);
        wrapBtn.setAttribute('aria-pressed', wrapped ? 'true' : 'false');
    });

    pre.replaceWith(block);

    const entry = { block, code: newCode, language, raw, blockIndex };
    paintCode(entry, escapeHtml(raw));

    return entry;
}

function paintCode(entry, html) {
    const lines = splitHighlightedLines(html);

    entry.code.innerHTML = lines.map((lineHtml, index) => {
        const number = index + 1;
        const anchor = `c${entry.blockIndex}-L${number}`;
        return `<span class="code-line" id="${anchor}"><span class="code-num" aria-hidden="true"><a href="#${anchor}" tabindex="-1">${number}</a></span><span class="code-txt">${lineHtml}</span></span>`;
    }).join('');
}

async function renderCode(entry) {
    const { language, raw } = entry;

    // Lines are painted straight away so the layout never shifts later
    paintCode(entry, escapeHtml(raw));

    const resolved = language ? await resolveLanguage(language) : '';
    if (!resolved || !window.hljs) return;

    let html = escapeHtml(raw);
    try {
        html = window.hljs.highlight(raw, { language: resolved, ignoreIllegals: true }).value;
    } catch (error) {
        html = escapeHtml(raw);
    }

    paintCode(entry, html);
}

/* ---------------------------------------------------------------- content enhancers
   Poles konten markdown: task list, callout, tabel, gambar, tautan.
   Polish the markdown content: task lists, callouts, tables, images, links. */

const CALLOUTS = [
    { key: 'danger', labels: ['danger', 'caution', 'critical', 'berbahaya', 'hati-hati'], title: 'Danger' },
    { key: 'warning', labels: ['warning', 'peringatan', 'perhatian'], title: 'Warning' },
    { key: 'tip', labels: ['tip', 'tips', 'hints'], title: 'Tip' },
    { key: 'note', labels: ['note', 'noted', 'catatan', 'info', 'information', 'catatan penting', 'important', 'penting'], title: 'Note' }
];

function buildCallout(type, title, nodes) {
    const box = document.createElement('aside');
    box.className = `callout callout-${type}`;

    const heading = document.createElement('div');
    heading.className = 'callout-title';
    heading.innerHTML = `${icon(type)}<span>${escapeHtml(title)}</span>`;
    box.appendChild(heading);

    const body = document.createElement('div');
    body.className = 'callout-body';
    nodes.forEach(node => body.appendChild(node));
    box.appendChild(body);

    return box;
}

function enhanceCallouts(root) {
    root.querySelectorAll('blockquote').forEach(blockquote => {
        const first = blockquote.firstElementChild;
        if (!first || first.tagName !== 'P') return;

        const clone = first.cloneNode(true);
        let type = null;
        let title = '';

        const raw = clone.textContent.trim();
        const alert = raw.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i);

        if (alert) {
            const found = CALLOUTS.find(item => item.labels.includes(alert[1].toLowerCase()));
            if (found) {
                type = found.key;
                title = found.title;
                const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
                const textNode = walker.nextNode();
                if (textNode) {
                    textNode.textContent = textNode.textContent.replace(alert[0], '');
                }
            }
        } else {
            const strong = clone.firstElementChild;
            if (strong && strong.tagName === 'STRONG') {
                const label = strong.textContent.trim().replace(/:$/, '');
                const found = CALLOUTS.find(item => item.labels.includes(label.toLowerCase()));
                if (found) {
                    type = found.key;
                    title = label;
                    strong.remove();
                }
            }
        }

        if (!type) return;

        const body = document.createElement('div');
        body.appendChild(clone);
        Array.from(blockquote.childNodes).forEach(node => {
            if (node !== first) body.appendChild(node.cloneNode(true));
        });

        blockquote.replaceWith(buildCallout(type, title, Array.from(body.childNodes)));
    });
}

function enhanceHeadings(root) {
    const headings = [];
    const used = new Set();

    root.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
        const text = heading.textContent.trim();
        let id = slugify(text);
        let counter = 1;
        while (used.has(id)) {
            counter++;
            id = `${slugify(text)}-${counter}`;
        }
        used.add(id);
        heading.id = id;

        const anchor = document.createElement('a');
        anchor.className = 'heading-anchor';
        anchor.href = `#${id}`;
        anchor.setAttribute('aria-label', `Link to ${text}`);
        anchor.innerHTML = icon('arrowRight');
        heading.insertBefore(anchor, heading.firstChild);

        if (['H2', 'H3', 'H4'].includes(heading.tagName)) {
            headings.push({ id, text, level: Number(heading.tagName.slice(1)) });
        }
    });

    return headings;
}

function enhanceTables(root) {
    root.querySelectorAll('table').forEach(table => {
        if (table.parentElement && table.parentElement.classList.contains('table-wrap')) return;
        const wrap = document.createElement('div');
        wrap.className = 'table-wrap';
        table.parentNode.insertBefore(wrap, table);
        wrap.appendChild(table);
    });
}

function enhanceImages(root) {
    root.querySelectorAll('img').forEach(image => {
        image.loading = 'lazy';
        image.decoding = 'async';

        // Ruang ditahan dulu biar layout tidak melompat saat gambar dimuat
        if (!image.style.aspectRatio) {
            image.style.aspectRatio = '16 / 9';

            const settle = () => {
                if (image.naturalWidth && image.naturalHeight) {
                    image.style.aspectRatio = `${image.naturalWidth} / ${image.naturalHeight}`;
                } else {
                    image.style.aspectRatio = '';
                }
            };

            if (image.complete && image.naturalWidth) settle();
            else image.addEventListener('load', settle, { once: true });
        }

        const alt = image.getAttribute('alt') || '';
        const src = image.getAttribute('src') || '';
        const insideLink = !!image.closest('a');

        // Gambar di dalam link tetap di tempatnya, klik harus membuka tautan
        if (!insideLink && !image.closest('figure')) {
            const figure = document.createElement('figure');
            image.parentNode.insertBefore(figure, image);
            figure.appendChild(image);
            // Only descriptive alt text earns a caption
            if (alt && alt.trim().split(/\s+/).length > 1) {
                const caption = document.createElement('figcaption');
                caption.textContent = alt;
                figure.appendChild(caption);
            }
        }

        if (!insideLink) {
            image.addEventListener('click', () => openLightbox(src, alt));
        }

        image.addEventListener('error', () => {
            image.classList.add('is-broken');
        });
    });
}

function enhanceLinks(root) {
    root.querySelectorAll('a[href]').forEach(link => {
        const href = link.getAttribute('href');
        if (/^https?:\/\//i.test(href)) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        }
    });
}

const taskState = new Map();

function taskStorageKey(slug) {
    return `read:tasks:${slug || 'article'}`;
}

function loadTaskState(slug) {
    if (taskState.has(slug)) return taskState.get(slug);

    let saved = [];
    try {
        saved = JSON.parse(localStorage.getItem(taskStorageKey(slug)) || '[]');
    } catch (error) {
        saved = [];
    }

    const set = new Set(Array.isArray(saved) ? saved : []);
    taskState.set(slug, set);
    return set;
}

function saveTaskState(slug, set) {
    try {
        localStorage.setItem(taskStorageKey(slug), JSON.stringify(Array.from(set)));
    } catch (error) {
        // storage penuh atau dinonaktifkan, centang tetap jalan di memori
    }
}

function enhanceTaskLists(root, slug) {
    const saved = loadTaskState(slug);
    const items = Array.from(root.querySelectorAll('li'));
    let index = 0;

    items.forEach(item => {
        const box = item.querySelector(':scope > input[type="checkbox"]');
        if (!box) return;

        const current = index++;

        // marked mengirim checkbox sebagai disabled, task list harus bisa dicentang
        box.removeAttribute('disabled');
        box.disabled = false;
        box.dataset.taskIndex = String(current);
        item.classList.add('task-list-item');

        if (saved.has(current)) box.checked = true;

        // Teks item dibungkus label supaya klik pada teks juga mencentang
        if (!item.querySelector(':scope > label')) {
            const label = document.createElement('label');
            label.className = 'task-label';

            while (item.firstChild) label.appendChild(item.firstChild);

            // Checkbox selalu ditTaruh di depan teksnya
            if (box.parentNode === label) label.insertBefore(box, label.firstChild);
            item.appendChild(label);
        }

        box.addEventListener('change', () => {
            if (box.checked) saved.add(current);
            else saved.delete(current);
            saveTaskState(slug, saved);
        });
    });
}

/* ---------------------------------------------------------------- clipboard
   Salin teks ke clipboard dengan fallback untuk browser lama.
   Copy text to the clipboard with a fallback for older browsers. */

async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            // fall through to the legacy path
        }
    }

    try {
        const helper = document.createElement('textarea');
        helper.value = text;
        helper.setAttribute('readonly', '');
        helper.style.position = 'fixed';
        helper.style.top = '0';
        helper.style.left = '-9999px';
        helper.style.opacity = '0';
        document.body.appendChild(helper);
        helper.select();
        helper.setSelectionRange(0, helper.value.length);
        const copied = document.execCommand('copy');
        helper.remove();
        return copied;
    } catch (error) {
        return false;
    }
}

/* ---------------------------------------------------------------- lightbox
   Lightbox gambar: perbesar gambar dengan navigasi keyboard.
   Image lightbox: enlarge images with keyboard navigation. */

function openLightbox(src, alt) {
    let lightbox = document.getElementById('lightbox');
    if (!lightbox) {
        lightbox = document.createElement('div');
        lightbox.id = 'lightbox';
        lightbox.className = 'lightbox';
        lightbox.innerHTML = '<button class="lightbox-close" aria-label="Close image"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"></path></svg></button><img alt="">';
        document.body.appendChild(lightbox);

        lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
        lightbox.addEventListener('click', event => {
            if (event.target === lightbox) closeLightbox();
        });
    }

    const image = lightbox.querySelector('img');
    image.src = src;
    image.alt = alt;
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
}

/* ---------------------------------------------------------------- table of contents
   Daftar isi: bangun dari heading, sinkron scroll, rail mobile.
   Table of contents: build from headings, follow the scroll, draw the mobile rail. */

const TOC_SCROLL_GAP = 20;
let tocRevealActive = null;

function renderToc(headings) {
    if (!headings.length) {
        if (el.tocAside) el.tocAside.hidden = true;
        if (el.tocToggle) el.tocToggle.hidden = true;
        if (el.drawer) el.drawer.hidden = true;
        return;
    }

    const html = headings.map((heading, index) =>
        `<li class="toc-level-${heading.level}" style="--i:${index}"><a href="#${heading.id}">${escapeHtml(heading.text)}</a></li>`
    ).join('');

    if (el.toc) el.toc.innerHTML = html;
    if (el.tocMobile) el.tocMobile.innerHTML = html;
}

// Garis baca: tepat di bawah bar sticky, jadi judul yang baru dilewati
// dianggap sedang dibaca
function tocReadingLine() {
    const bar = document.querySelector('.article-bar');
    const barHeight = bar ? bar.getBoundingClientRect().height : 0;
    return barHeight + TOC_SCROLL_GAP;
}

// Tinggi bar sticky dipakai CSS supaya kolom TOC tidak ketutup bar
function syncStickyOffset() {
    const bar = document.querySelector('.article-bar');
    if (!bar) return;
    document.documentElement.style.setProperty('--sticky-offset', `${Math.round(bar.getBoundingClientRect().height)}px`);
}

function scrollToHeading(id, smooth) {
    const target = document.getElementById(id);
    if (!target) return false;

    const top = Math.max(0, window.scrollY + target.getBoundingClientRect().top - tocReadingLine());
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top, behavior: smooth && !reduce ? 'smooth' : 'auto' });
    return true;
}

// Gambar lazy atau blok kode bisa mengubah tinggi halaman setelah scroll selesai.
// Targetnya dikembalikan ke posisi yang pas selama layout sedang beres.
function settleHeading(id) {
    const target = document.getElementById(id);
    if (!target) return;

    let deadline = Date.now() + 1800;
    let tries = 0;

    function stop() {
        deadline = 0;
    }

    function align() {
        if (Date.now() > deadline || tries >= 6) return;

        const drift = target.getBoundingClientRect().top - tocReadingLine();
        if (Math.abs(drift) < 4) return;

        tries++;
        window.scrollBy({ top: drift, behavior: 'auto' });
        setTimeout(align, 220);
    }

    window.addEventListener('wheel', stop, { once: true, passive: true });
    window.addEventListener('touchstart', stop, { once: true, passive: true });
    setTimeout(align, 280);
}

function setupToc(headings) {
    const groups = [
        { list: el.toc, links: el.toc ? Array.from(el.toc.querySelectorAll('a')) : [] },
        { list: el.tocMobile, links: el.tocMobile ? Array.from(el.tocMobile.querySelectorAll('a')) : [] },
    ].filter(group => group.links.length);

    if (!groups.length || !headings.length) return;

    const allLinks = groups.flatMap(group => group.links);
    let activeId = null;
    let ticking = false;

    function updateRail(group, link) {
        if (!group.list) return;
        // Daftar yang masih tersembunyi tidak punya ukuran, rail-nya nanti saja
        if (!group.list.getClientRects().length) return;

        const fill = link ? link.offsetTop + link.offsetHeight : 0;
        group.list.style.setProperty('--toc-fill', `${Math.max(0, fill)}px`);
    }

    // Geser daftar supaya bagian aktif tetap kelihatan, tanpa menyentuh scroll halaman
    function keepVisible(group, link) {
        if (!group.list || !link) return;

        const container = group.list.closest('.toc, .toc-drawer-panel');
        if (!container || !container.getClientRects().length) return;
        if (container.scrollHeight <= container.clientHeight + 1) return;

        const box = container.getBoundingClientRect();
        const item = link.getBoundingClientRect();

        // Aktif-item disimpan di zona nyaman, bukan cuma nempel di tepi
        const band = Math.min(110, box.height * 0.22);

        if (item.top < box.top + band) {
            container.scrollTop -= (box.top + band - item.top);
        } else if (item.bottom > box.bottom - band) {
            container.scrollTop += (item.bottom - (box.bottom - band));
        }
    }

    function setActive(id, keepVisibleToo) {
        activeId = id;

        const order = headings.map(heading => heading.id);
        const position = order.indexOf(id);

        allLinks.forEach(link => {
            const on = link.getAttribute('href') === `#${id}`;
            const passed = position > -1 && order.indexOf(link.getAttribute('href').slice(1)) < position;
            link.classList.toggle('is-active', on);
            link.classList.toggle('is-passed', passed);
            if (on) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
        });

        groups.forEach(group => {
            const link = group.links.find(item => item.getAttribute('href') === `#${id}`) || null;
            updateRail(group, link);
            keepVisible(group, link);
        });
    }

    function currentSection() {
        const line = tocReadingLine() + 4;
        let current = headings[0].id;

        for (const heading of headings) {
            const node = document.getElementById(heading.id);
            if (!node) continue;
            if (node.getBoundingClientRect().top <= line) current = heading.id;
        }

        // Di dasar halaman, bagian terakhir yang aktif selama masih terlihat
        const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
        if (atBottom) {
            const last = headings[headings.length - 1];
            const node = last ? document.getElementById(last.id) : null;
            if (node && node.getBoundingClientRect().top < window.innerHeight) current = last.id;
        }

        return current;
    }

    function sync() {
        setActive(currentSection());
        updateTocMeter(readingPercent());
    }

    function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            ticking = false;
            sync();
        });
    }

    // Klik: scroll halus ke bagiannya, status aktif langsung berubah
    groups.forEach(group => {
        group.list.addEventListener('click', event => {
            const link = event.target.closest('a[href^="#"]');
            if (!link) return;

            const id = decodeURIComponent(link.getAttribute('href').slice(1));
            if (!document.getElementById(id)) return;

            event.preventDefault();
            setActive(id, true);
            scrollToHeading(id, true);
            settleHeading(id);
            history.replaceState(null, '', `#${id}`);
        });

        // Panah atas/bawah memindah fokus antar item
        group.list.addEventListener('keydown', event => {
            if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;

            const index = group.links.indexOf(document.activeElement);
            if (index === -1) return;

            event.preventDefault();
            const next = group.links[index + (event.key === 'ArrowDown' ? 1 : -1)];
            if (next) next.focus();
        });
    });

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    syncStickyOffset();
    sync();

    // Rail dan daftar aktif siap saat drawer dibuka
    tocRevealActive = () => {
        const group = groups.find(item => item.list && item.list.getClientRects().length);
        if (!group) return;
        const link = group.links.find(item => item.getAttribute('href') === `#${activeId}`) || null;
        updateRail(group, link);
        keepVisible(group, link);
    };

    // Buka lewat tautan #: langsung ke bagian itu
    const hash = decodeURIComponent(window.location.hash.slice(1));
    if (hash && document.getElementById(hash)) {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                scrollToHeading(hash, false);
                settleHeading(hash);
                setActive(hash, true);
            });
        });
    }
}

function setupTocDrawer() {
    const toggle = el.tocToggle;
    const drawer = el.drawer;
    if (!toggle || !drawer) return;

    const close = () => {
        drawer.classList.remove('is-open');
        drawer.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
    };

    const open = () => {
        drawer.hidden = false;
        drawer.classList.add('is-open');
        toggle.setAttribute('aria-expanded', 'true');
        if (tocRevealActive) tocRevealActive();
    };

    toggle.addEventListener('click', () => {
        if (drawer.classList.contains('is-open')) close();
        else open();
    });

    if (el.tocClose) el.tocClose.addEventListener('click', close);

    const backdrop = drawer.querySelector('.toc-drawer-backdrop');
    if (backdrop) backdrop.addEventListener('click', close);

    // Delegated: the list is rendered after this setup runs
    drawer.addEventListener('click', event => {
        if (event.target.closest('a')) close();
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') close();
    });
}

/* ---------------------------------------------------------------- reading progress
   Progress bar membaca, dihitung dari posisi scroll artikel.
   Reading progress bar, computed from the article scroll position. */

// Seberapa jauh artikel sudah dibaca, dalam persen
function readingPercent() {
    const article = document.querySelector('.article-column');
    if (!article) return 0;

    const start = article.getBoundingClientRect().top + window.scrollY;
    const distance = Math.max(1, article.offsetHeight - window.innerHeight);
    const scrolled = window.scrollY - start;
    return Math.min(100, Math.max(0, (scrolled / distance) * 100));
}

function updateTocMeter(percent) {
    const value = `${Math.round(percent)}%`;

    if (el.tocMeter) el.tocMeter.style.width = `${percent.toFixed(2)}%`;
    if (el.tocMeterMobile) el.tocMeterMobile.style.width = `${percent.toFixed(2)}%`;
    if (el.tocPercent) el.tocPercent.textContent = value;
    if (el.tocPercentMobile) el.tocPercentMobile.textContent = value;
}

function setupProgress() {
    const article = document.querySelector('.article-column');
    if (!article || !el.progress) return;

    let ticking = false;

    function update() {
        const start = article.getBoundingClientRect().top + window.scrollY;
        const distance = Math.max(1, article.offsetHeight - window.innerHeight);
        const scrolled = window.scrollY - start;
        const percent = Math.min(100, Math.max(0, (scrolled / distance) * 100));
        el.progress.style.width = `${percent.toFixed(2)}%`;
    }

    window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            update();
            ticking = false;
        });
    }, { passive: true });

    window.addEventListener('resize', update);
    update();

    // The page grows when images or the comment box arrive
    if (window.ResizeObserver) {
        const observer = new ResizeObserver(() => update());
        observer.observe(article);
    }
}

/* ---------------------------------------------------------------- math & mermaid
   Matematika (KaTeX) dan diagram Mermaid, dimuat saat dibutuhkan.
   Math (KaTeX) and Mermaid diagrams, loaded on demand. */

const KATEX_JS = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js';
const KATEX_CSS = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css';
const MERMAID_JS = 'https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js';

let katexReady = null;
let mermaidReady = null;

function loadScriptOnce(url, id) {
    const existing = document.getElementById(id);
    if (existing) return Promise.resolve(true);

    return new Promise(resolve => {
        const script = document.createElement('script');
        script.src = url;
        script.id = id;
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.head.appendChild(script);
    });
}

function loadKatex() {
    if (window.katex) return Promise.resolve(true);
    if (katexReady) return katexReady;

    katexReady = Promise.all([
        loadScriptOnce(KATEX_JS, 'katex-js'),
        new Promise(resolve => {
            if (document.getElementById('katex-css')) return resolve(true);
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = KATEX_CSS;
            link.id = 'katex-css';
            link.onload = () => resolve(true);
            link.onerror = () => resolve(false);
            document.head.appendChild(link);
        })
    ]).then(results => {
        const ok = results.every(Boolean) && !!window.katex;
        if (!ok) katexReady = null;
        return ok;
    });

    return katexReady;
}

function renderMath(root) {
    const nodes = root.querySelectorAll('[data-math]');
    if (!nodes.length) return;

    loadKatex().then(ready => {
        if (!ready) return;

        nodes.forEach(node => {
            const tex = node.getAttribute('data-math') || '';
            try {
                node.innerHTML = window.katex.renderToString(tex, {
                    displayMode: node.classList.contains('math-block'),
                    throwOnError: false,
                    output: 'html'
                });
            } catch (error) {
                // Teks aslinya tetap ditampilkan kalau formula tidak valid
            }
        });
    });
}

function loadMermaid() {
    if (window.mermaid) return Promise.resolve(true);
    if (mermaidReady) return mermaidReady;

    mermaidReady = loadScriptOnce(MERMAID_JS, 'mermaid-js').then(ok => {
        if (!ok || !window.mermaid) {
            mermaidReady = null;
            return false;
        }

        window.mermaid.initialize({
            startOnLoad: false,
            theme: 'dark',
            securityLevel: 'strict',
            fontFamily: 'inherit'
        });

        return true;
    });

    return mermaidReady;
}

function renderMermaid(root) {
    const nodes = root.querySelectorAll('.mermaid-block');
    if (!nodes.length) return;

    loadMermaid().then(ready => {
        if (!ready) return;

        try {
            window.mermaid.run({ nodes: Array.from(nodes) });
        } catch (error) {
            // Diagram gagal di-render, source-nya tetap terbaca
        }
    });
}

/* ---------------------------------------------------------------- youtube card
   Kartu video: deteksi tautan YouTube, ambil metadata, putar inline.
   Video cards: detect YouTube links, fetch metadata, play inline. */

function youtubeId(url) {
    const patterns = [
        /[?&]v=([\w-]{6,})/,
        /youtu\.be\/([\w-]{6,})/,
        /\/embed\/([\w-]{6,})/,
        /\/shorts\/([\w-]{6,})/,
        /\/live\/([\w-]{6,})/
    ];

    for (const pattern of patterns) {
        const match = pattern.exec(url);
        if (match) return match[1];
    }

    return null;
}

// Embed YouTube butuh origin yang sah. Halaman yang dibuka lewat file://
// punya origin "null", dan itu yang bikin player protes error 153.
function pageOrigin() {
    const origin = window.location.origin;

    if (!origin || origin === 'null') return '';
    if (!/^https?:$/.test(window.location.protocol)) return '';

    return origin;
}

function withEmbedOrigin(src) {
    const origin = pageOrigin();

    if (!origin) return src;
    if (/[?&]origin=/.test(src)) return src;

    return `${src}${src.includes('?') ? '&' : '?'}origin=${encodeURIComponent(origin)}`;
}

function enhanceYouTube(root) {
    const canEmbed = !!pageOrigin();

    // Iframe dari markdown dibatasi hanya ke YouTube, sisanya dibuang
    root.querySelectorAll('iframe').forEach(frame => {
        const src = frame.getAttribute('data-src') || frame.getAttribute('src') || '';
        const allowed = /^https:\/\/(www\.)?(youtube\.com|youtube-nocookie\.com)\/embed\/[\w-]+/.test(src);

        if (!allowed) {
            frame.remove();
            return;
        }

        const id = youtubeId(src);

        // Tanpa origin yang sah player akan protes error 153, jadi
        // iframe-nya diganti tautan biasa ke videonya
        if (!canEmbed && id) {
            const link = document.createElement('a');
            link.href = `https://www.youtube.com/watch?v=${id}`;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = ARTICLE_LANG === 'en'
                ? 'Watch this video on YouTube'
                : 'Tonton video ini di YouTube';

            const paragraph = document.createElement('p');
            paragraph.appendChild(link);
            frame.replaceWith(paragraph);
            return;
        }

        frame.removeAttribute('data-src');
        frame.setAttribute('src', withEmbedOrigin(src));
        frame.setAttribute('loading', 'lazy');
        frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
        if (!frame.getAttribute('title')) frame.setAttribute('title', 'Embedded video');
    });

    const links = Array.from(root.querySelectorAll('a[href*="youtube.com"], a[href*="youtu.be"]'));

    links.forEach(link => {
        const href = link.getAttribute('href') || '';
        const id = youtubeId(href);
        if (!id) return;

        // Link yang_isinya gambar atau teks saja yang jadi kartu
        const hasImage = !!link.querySelector('img');
        const textOnly = link.children.length === 0 && link.textContent.trim().length > 0;
        if (!hasImage && !textOnly) return;

        const label = link.getAttribute('title') || link.textContent.trim() || 'YouTube video';

        const card = document.createElement('div');
        card.className = 'video-card';
        card.dataset.videoId = id;

        const frame = document.createElement('div');
        frame.className = 'video-frame';

        const thumb = document.createElement('img');
        thumb.className = 'video-thumb';
        thumb.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
        thumb.alt = label;
        thumb.loading = 'lazy';

        const play = document.createElement('button');
        play.type = 'button';
        play.className = 'video-play';
        play.setAttribute('aria-label', ARTICLE_LANG === 'en' ? 'Play video on this page' : 'Putar video di halaman ini');
        play.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"></path></svg>';

        frame.appendChild(thumb);
        frame.appendChild(play);

        const meta = document.createElement('div');
        meta.className = 'video-meta';

        const title = document.createElement('span');
        title.className = 'video-title';
        title.textContent = label;

        const source = document.createElement('span');
        source.className = 'video-source';
        source.textContent = 'youtube.com';

        meta.appendChild(title);
        meta.appendChild(source);

        card.appendChild(frame);
        card.appendChild(meta);

        // Dua pilihan menonton:=inline di blog ini, atau penuh di YouTube
        const actions = document.createElement('div');
        actions.className = 'video-actions';

        const here = document.createElement('button');
        here.type = 'button';
        here.className = 'video-action';
        here.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"></path></svg>'
            + `<span>${ARTICLE_LANG === 'en' ? 'Play on this blog' : 'Putar di blog ini'}</span>`;

        const onYouTube = document.createElement('a');
        onYouTube.className = 'video-action';
        onYouTube.href = `https://www.youtube.com/watch?v=${id}`;
        onYouTube.target = '_blank';
        onYouTube.rel = 'noopener noreferrer';
        onYouTube.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"></path></svg>'
            + `<span>${ARTICLE_LANG === 'en' ? 'Watch on YouTube' : 'Tonton di YouTube'}</span>`;

        actions.appendChild(here);
        actions.appendChild(onYouTube);
        card.appendChild(actions);

        // Tanpa origin yang sah (misal halaman dibuka dari file://) player
        // YouTube akan protes error 153, jadi langsung arahkan ke YouTube
        const canEmbed = !!pageOrigin();

        if (!canEmbed) {
            here.disabled = true;
            here.title = ARTICLE_LANG === 'en'
                ? 'Inline player needs the page to be served over http(s)'
                : 'Player inline butuh halaman yang disajikan lewat http(s)';
        }

        const startPlayback = () => {
            if (frame.classList.contains('is-playing')) return;

            if (!canEmbed) {
                window.open(`https://www.youtube.com/watch?v=${id}`, '_blank', 'noopener');
                return;
            }

            const iframe = document.createElement('iframe');
            iframe.src = withEmbedOrigin(`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1`);
            iframe.title = title.textContent || 'YouTube video';
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
            iframe.allowFullscreen = true;
            iframe.loading = 'lazy';
            iframe.referrerPolicy = 'strict-origin-when-cross-origin';
            frame.replaceChildren(iframe);
            frame.classList.add('is-playing');

            here.querySelector('span').textContent = ARTICLE_LANG === 'en' ? 'Playing here' : 'Sedang diputar';
            here.classList.add('is-active');
        };

        here.addEventListener('click', startPlayback);

        // Kalau paragrafnya cuma berisi link itu, replace paragrafnya
        const paragraph = link.closest('p');
        const lone = paragraph && paragraph.children.length === 1
            && !paragraph.textContent.replace(link.textContent, '').trim();

        if (lone && paragraph.parentNode) paragraph.parentNode.replaceChild(card, paragraph);
        else link.replaceWith(card);

        play.addEventListener('click', startPlayback);

        // Metadata diambil dari oEmbed, kalau gagal dipakai judul bawaan
        fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(href)}&format=json`)
            .then(response => (response.ok ? response.json() : null))
            .then(data => {
                if (!data) return;
                if (data.title) title.textContent = data.title;
                if (data.author_name) source.textContent = data.author_name;
            })
            .catch(() => {});
    });
}

/* ---------------------------------------------------------------- prev / next / related
   Navigasi artikel: sebelumnya, berikutnya, dan artikel terkait.
   Article navigation: previous, next, and the related list. */

function sortedProjects() {
    if (typeof myProjects === 'undefined') return [];
    return myProjects
        .filter(project => project && project.id && project.rawUrl)
        .slice()
        .sort((a, b) => {
            const dateA = a.publishedDate ? new Date(a.publishedDate).getTime() : 0;
            const dateB = b.publishedDate ? new Date(b.publishedDate).getTime() : 0;
            return dateB - dateA;
        });
}

function articleUrl(project) {
    return `read.html?post=${project.id}${ARTICLE_LANG === 'en' ? '&lang=en' : ''}`;
}

// Trending: gabungan usia artikel dan relevansi terhadap artikel yang sedang dibaca
function trendingProjects(current, limit) {
    const now = Date.now();
    const currentTags = (current && current.tags ? current.tags : []).map(tag => String(tag).toLowerCase());

    return sortedProjects()
        .filter(project => project.id !== (current ? current.id : ''))
        .map(project => {
            const stamp = project.publishedDate ? new Date(project.publishedDate).getTime() : 0;
            const ageDays = stamp ? Math.max(0, (now - stamp) / 86400000) : 365;
            const time = Math.exp(-ageDays / 90);

            const tags = (project.tags ? project.tags : []).map(tag => String(tag).toLowerCase());
            const shared = tags.filter(tag => currentTags.includes(tag)).length;
            const sameCategory = current && project.category && project.category === current.category ? 1 : 0;
            const relevance = Math.min(1, shared * 0.3 + sameCategory * 0.3);

            return { project, score: time * 0.55 + relevance * 0.45 };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}

// Cover image diambil dari markdown artikelnya, sama seperti kartu di listing blog
function thumbnailPlaceholder(label) {
    const text = String(label || '·').trim().slice(0, 2).toUpperCase();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200">` +
        `<rect width="320" height="200" fill="#0d1117"/>` +
        `<text x="160" y="100" fill="#333a41" font-family="sans-serif" font-size="38" text-anchor="middle" dominant-baseline="middle">${text}</text>` +
        `</svg>`;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function loadThumbnail(project) {
    const url = ARTICLE_LANG !== 'id'
        ? (project.rawUrlEn || project.rawUrl)
        : project.rawUrl;

    if (!url) return Promise.resolve(null);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    return fetch(url, { signal: controller.signal })
        .then(response => (response.ok ? response.text() : ''))
        .then(text => {
            clearTimeout(timer);
            if (!text) return null;

            const images = [];
            const markdownImage = /!\[[^\]]*\]\(([^)]+)\)/gi;
            const htmlImage = /<img[^>]*src=["']([^"']+)["']/gi;
            let match;

            // Gambar markdown didahulukan, biasanya itu cover artikelnya
            while ((match = markdownImage.exec(text)) !== null) images.push(match[1]);
            while ((match = htmlImage.exec(text)) !== null) images.push(match[1]);

            for (const image of images) {
                const lower = image.toLowerCase();
                if (lower.includes('shields.io') || lower.includes('badge') || lower.includes('actions/workflows')) continue;

                if (image.startsWith('http')) return image;

                const base = url.substring(0, url.lastIndexOf('/') + 1);
                return base + image.replace(/^\.\//, '');
            }

            return null;
        })
        .catch(() => {
            clearTimeout(timer);
            return null;
        });
}

function renderNavigation() {
    const list = sortedProjects();
    if (!list.length) return;

    const index = list.findIndex(project => project.id === postId);
    const previous = index > 0 ? list[index - 1] : null;

    if (el.nav) {
        el.nav.innerHTML = '';
        el.nav.hidden = !previous;

        if (previous) {
            const link = document.createElement('a');
            link.className = 'article-nav-link is-prev';
            link.href = articleUrl(previous);
            link.innerHTML = `<span>${ARTICLE_LANG === 'en' ? 'Previous' : 'Sebelumnya'}</span><strong>${escapeHtml(humanize(previous.id))}</strong>`;
            el.nav.appendChild(link);
        }
    }

    if (el.related && el.relatedBox) {
        const trending = trendingProjects(currentProject, 3);
        el.relatedBox.hidden = trending.length === 0;

        const title = document.getElementById('related-title');
        if (title) {
            title.textContent = ARTICLE_LANG === 'en' ? 'My recent blog' : 'Blog saya terbaru';
        }

        const hint = document.getElementById('related-hint');
        if (hint) {
            hint.textContent = ARTICLE_LANG === 'en'
                ? 'Want to explore every post that is already out?'
                : 'Mau explore artikel yang sudah diposting?';
        }

        const ctaLabel = document.getElementById('related-cta-label');
        if (ctaLabel) {
            ctaLabel.textContent = ARTICLE_LANG === 'en' ? 'See all articles' : 'Lihat semua artikel';
        }

        el.related.innerHTML = trending.map(entry => {
            const project = entry.project;
            const heading = project.title || humanize(project.id);
            const meta = [
                project.publishedDate ? formatDate(project.publishedDate) : null,
                project.category ? humanize(project.category) : null
            ].filter(Boolean).join(' · ');

            // Skala thumbnail dan teks mengikuti panjang judul, bukan angka mati
            const scale = Math.min(1.2, Math.max(0.9, 0.9 + heading.length * 0.011));

            return `
                <a class="related-item" href="${articleUrl(project)}" style="--rel-scale: ${scale.toFixed(3)}">
                    <span class="related-thumb">
                        <img src="${thumbnailPlaceholder(heading)}" alt="" loading="lazy" data-thumb>
                    </span>
                    <span class="related-body">
                        <strong>${escapeHtml(heading)}</strong>
                        <span class="related-meta">${escapeHtml(meta)}</span>
                    </span>
                    <span class="related-arrow" aria-hidden="true">
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M7 7h10v10"></path></svg>
                    </span>
                </a>
            `;
        }).join('');

        // Cover image diambil setelah item dirender supaya halaman tidak nunggu
        trending.forEach((entry, position) => {
            const image = el.related.querySelectorAll('[data-thumb]')[position];
            if (!image) return;

            loadThumbnail(entry.project).then(source => {
                if (!source) return;
                image.src = source;
                image.parentElement.classList.add('has-image');
            });
        });
    }
}

/* ---------------------------------------------------------------- giscus
   Pasang komentar Giscus dari repo sumber artikel.
   Mount the Giscus comment thread from the article source repository. */

function injectGiscus(repoUrl) {
    const wrapper = document.getElementById('giscus-wrapper');
    if (!wrapper) return;

    let config = null;

    if (typeof myProjects !== 'undefined') {
        const project = myProjects.find(item => {
            const derived = item.rawUrlEn || (item.rawUrl
                ? (item.rawUrl.endsWith('-id.md') ? item.rawUrl.replace('-id.md', `-${ARTICLE_LANG}.md`) : item.rawUrl.replace('.md', `-${ARTICLE_LANG}.md`))
                : null);
            return item.rawUrl === repoUrl || derived === repoUrl;
        });

        if (project) {
            config = project.giscus || {
                repo: 'iMoon07/Penjelajah-CyberSecurity',
                repoId: 'R_kgDOTDbgbA',
                category: 'Q&A',
                categoryId: 'DIC_kwDOTDbgbM4C_xMv'
            };
        }
    }

    if (!config) return;

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', config.repo);
    script.setAttribute('data-repo-id', config.repoId);
    script.setAttribute('data-category', config.category);
    script.setAttribute('data-category-id', config.categoryId);
    script.setAttribute('data-mapping', 'specific');
    script.setAttribute('data-term', postId || 'General-Discussion');
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'bottom');
    script.setAttribute('data-theme', 'dark');
    script.setAttribute('data-lang', 'en');
    script.crossOrigin = 'anonymous';
    script.async = true;

    wrapper.appendChild(script);
}

/* ---------------------------------------------------------------- source
   Baris sumber: repo tempat markdown artikel itu tinggal.
   Source row: the repository where the article markdown lives. */

function renderSource(project) {
    const box = document.getElementById('article-source');
    if (!box) return;

    const repo = projectRepo(project);
    if (!repo) {
        box.hidden = true;
        return;
    }

    const name = document.getElementById('article-source-name');
    if (name) name.textContent = repo.repo || repo.name;

    const path = document.getElementById('article-source-path');
    if (path) {
        // Path panjang dipotong di tengah, bagian folder terakhir tetap terlihat
        const segments = repo.folder ? repo.folder.split('/') : [];
        const tail = segments.length ? segments[segments.length - 1] : '';
        const parts = [];

        if (repo.owner) parts.push(repo.owner);
        if (tail) parts.push(segments.length > 1 ? `…/${tail}` : tail);

        path.textContent = parts.join(' · ');
        path.hidden = parts.length === 0;
    }

    box.href = repo.url;
    box.title = [repo.owner, repo.repo, repo.folder].filter(Boolean).join('/');
    box.hidden = false;
}

/* ---------------------------------------------------------------- reveal
   Tampilkan artikel setelah render selesai, supaya layout tidak berkedip.
   Reveal the article once rendering is done, so the layout does not flash. */

function revealArticle() {
    const layout = document.getElementById('article-layout');
    if (layout) layout.classList.add('is-revealed');
}

/* ---------------------------------------------------------------- render
   Render artikel: parser, sanitasi, lalu pemasangan semua enhancer.
   Article rendering: parsing, sanitising, then hooking up every enhancer. */

const HTML_TAG_NAMES = new Set('a|abbr|address|area|article|aside|audio|b|base|bdi|bdo|blockquote|body|br|button|canvas|caption|cite|code|col|colgroup|data|datalist|dd|del|details|dfn|dialog|div|dl|dt|em|embed|fieldset|figcaption|figure|footer|form|h1|h2|h3|h4|h5|h6|head|header|hgroup|hr|html|i|iframe|img|input|ins|kbd|label|legend|li|link|main|map|mark|menu|meta|meter|nav|noscript|object|ol|optgroup|option|output|p|picture|pre|progress|q|rp|rt|ruby|s|samp|script|section|select|slot|small|source|span|strong|style|sub|summary|sup|table|tbody|td|template|textarea|tfoot|th|thead|time|title|tr|track|u|ul|var|video|wbr'.split('|'));

// Tag HTML yang atributnya pecah baris harus digabung, kalau tidak marked
// menganggapnya bukan HTML block dan tag mentah bocor ke artikel
function collapseHtmlTags(text) {
    return text.replace(/<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:[^<>])*?)(\/?)>/g, (match, closing, name, attrs, selfClose) => {
        if (!match.includes('\n')) return match;
        if (!HTML_TAG_NAMES.has(name.toLowerCase())) return match;

        const flat = attrs.replace(/\s*\n\s*/g, ' ').trim();
        return `<${closing}${name}${flat ? ' ' + flat : ''}${selfClose}>`;
    });
}

function rewriteMarkdown(text, basePath) {
    // Tag HTML multi baris digabung lebih dulu supaya tidak bocor sebagai teks
    text = collapseHtmlTags(text);

    // Relative images -> absolute path inside the repository folder
    text = text.replace(/!\[([^\]]*)\]\((?!https?:|data:)([^)\s]+)\)/g, (match, alt, path) => {
        return `![${alt}](${basePath}${path.replace(/^\.\//, '')})`;
    });

    text = text.replace(/<img([^>]*?)src=["'](?!https?:|data:)([^"']+)["']/gi, (match, attrs, path) => {
        return `<img${attrs}src="${basePath}${path.replace(/^\.\//, '')}"`;
    });

    // Relative markdown links -> reader pages
    text = text.replace(/(?<!!)\[([^\]]+)\]\((?!https?:|mailto:|#)([^)\s]+\.md)(?:#[^)]*)?\)/g, (match, label, path) => {
        const langMatch = path.match(/-([a-z]{2})\.md$/);
        const detectedLang = langMatch ? langMatch[1] : (path.includes('-en.md') ? 'en' : 'id');
        const langParam = detectedLang !== 'id' ? `&lang=${detectedLang}` : '';

        if (postId === 'about-me') {
            return langParam ? `[${label}](read.html?post=about-me${langParam})` : `[${label}](read.html?post=about-me)`;
        }

        if (postId) {
            return langParam ? `[${label}](read.html?post=${postId}${langParam})` : `[${label}](read.html?post=${postId})`;
        }

        return `[${label}](read.html?url=${basePath}${path})`;
    });

    return text;
}

function removeLeadingTitle(text) {
    // The title lives in the page header, so the leading h1 is not repeated.
    return text.replace(/^\s*#\s+[^\n]+\n+/, '');
}

function extractLede(text) {
    const lines = text.split('\n');

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (/^#/.test(trimmed)) continue;
        if (/^!\[/.test(trimmed)) continue;
        if (/^>/.test(trimmed)) continue;
        if (/^\|/.test(trimmed)) continue;
        if (/^\[/.test(trimmed)) continue;
        if (/^```/.test(trimmed)) continue;
        if (/^[-*+]\s/.test(trimmed)) continue;
        if (/^\d+\.\s/.test(trimmed)) continue;

        const plain = trimmed.replace(/[*_`>#]/g, '').trim();
        if (plain.length < 40) continue;
        if (!/\s/.test(plain)) continue;

        return plain;
    }

    return '';
}

function renderArticle(markdown, project) {
    const basePath = repoUrl.substring(0, repoUrl.lastIndexOf('/') + 1);
    const prepared = rewriteMarkdown(removeLeadingTitle(markdown), basePath);

    if (window.ArticleMarkdown) window.ArticleMarkdown.reset();

    const parsed = marked.parse(prepared, { gfm: true, breaks: false });

    // Daftar footnoteClosure diletakkan di akhir artikel
    const withFootnotes = parsed
        + (window.ArticleMarkdown ? window.ArticleMarkdown.footnotesHtml() : '');

    const sanitized = window.DOMPurify
        ? DOMPurify.sanitize(withFootnotes, {
            ADD_TAGS: [
                'figure', 'figcaption', 'details', 'summary', 'mark', 'kbd',
                'sub', 'sup', 'dl', 'dt', 'dd', 'iframe', 'section', 'video', 'source'
            ],
            ADD_ATTR: [
                'target', 'rel', 'align', 'id', 'loading', 'decoding', 'start',
                'style', 'class', 'width', 'height', 'frameborder', 'allowfullscreen',
                'allow', 'controls', 'poster', 'preload', 'muted', 'playsinline',
                'loop', 'autoplay', 'colspan', 'rowspan', 'open', 'role', 'title',
                'dir', 'lang', 'tabindex', 'name', 'value', 'type', 'checked',
                'disabled', 'readonly', 'selected', 'multiple', 'spellcheck',
                'referrerpolicy', 'sandbox', 'srcset', 'sizes', 'data-math'
            ],
            ALLOW_DATA_ATTR: true,
            ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|callto|sms|ftp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
        })
        : withFootnotes;

    // Src iframe ditahan dulu supaya tidak ada request sia-sia ke YouTube
    const withoutFrameSrc = sanitized.replace(
        /(<iframe\b[^>]*?)\ssrc="([^"]*)"/gi,
        (match, head, src) => `${head} data-src="${src}"`
    );

    el.content.innerHTML = withoutFrameSrc;
    enhanceTaskLists(el.content, project.id);
    enhanceCallouts(el.content);
    enhanceTables(el.content);
    enhanceImages(el.content);
    enhanceLinks(el.content);
    enhanceYouTube(el.content);

    const headings = enhanceHeadings(el.content);
    renderToc(headings);
    setupToc(headings);

    const blocks = Array.from(el.content.querySelectorAll('pre'))
        .map((pre, index) => buildCodeBlock(pre, index + 1))
        .filter(Boolean);

    // The page is readable now, the colours land a moment later
    Promise.all(blocks.map(renderCode)).catch(() => {});

    renderMath(el.content);
    renderMermaid(el.content);

    setupProgress();
    renderNavigation();
    renderSource(project);
    revealArticle();
}

function showError(message) {
    if (el.title) {
        el.title.textContent = ARTICLE_LANG === 'en' ? 'Article not found' : 'Artikel tidak ditemukan';
        document.title = `${el.title.textContent} - Raja Muhammad Kurnia Setyawan`;
    }

    if (el.lede) el.lede.hidden = true;

    if (!el.content) return;
    el.content.innerHTML = `<p class="article-error">${escapeHtml(message)}</p>
        <p class="article-error-hint">${ARTICLE_LANG === 'en'
            ? 'Return to the <a href="blog.html">article list</a>.'
            : 'Kembali ke <a href="blog.html">daftar artikel</a>.'}</p>`;

    revealArticle();
}

function loadArticle() {
    if (!repoUrl || repoUrl === '#') {
        showError(ARTICLE_LANG === 'en' ? 'Article not found.' : 'Artikel tidak ditemukan.');
        return;
    }

    if (el.content) {
        el.content.innerHTML = '<div class="article-skeleton" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>';
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    fetch(repoUrl, { signal: controller.signal })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            // Tanggal asli file di GitHub, gratis dari header ini
            const modified = response.headers.get('Last-Modified');
            return response.text().then(text => ({ text, modified }));
        })
        .then(({ text, modified }) => {
            clearTimeout(timer);

            const headingMatch = text.match(/^#\s+(.+)$/m);
            const title = (currentProject && currentProject.title) ? currentProject.title : (headingMatch ? headingMatch[1].trim() : (currentProject ? humanize(currentProject.id) : 'Article'));

            document.title = `${title} - Raja Muhammad Kurnia Setyawan`;
            if (el.title) el.title.textContent = title;

            const lede = extractLede(text);
            if (el.lede) {
                el.lede.textContent = lede;
                el.lede.hidden = !lede;
            }

            const updated = modified ? new Date(modified).toISOString().slice(0, 10) : null;
            buildMeta(currentProject, text, updated);

            renderArticle(text, currentProject);
            injectGiscus(repoUrl);

            // Riwayat commit diambil menyusul, tanggal statis sudah tampil
            fetchGitHistory(currentProject).then(applyGitHistory);
        })
        .catch(error => {
            clearTimeout(timer);
            showError(ARTICLE_LANG === 'en'
                ? 'The article could not be loaded. Check your connection and try again.'
                : 'Artikel gagal dimuat. Periksa koneksi lalu coba lagi.');
        });
}

/* ---------------------------------------------------------------- start
   Titik masuk: tentukan artikel, ambil datanya, lalu render.
   Entry point: resolve the article, fetch its data, then render. */

let redirected = false;

if (postId === 'about-me') {
    // The about page lives on the home page now
    redirected = true;
    window.location.replace('index.html#about');
} else if (postId && typeof myProjects !== 'undefined') {
    const project = myProjects.find(item => item.id === postId);
    if (project && typeof project.id === 'string' && project.id.trim() !== '') {
        currentProject = project;
        repoUrl = lang !== 'id'
            ? (project.rawUrlEn || (project.rawUrl
                ? (project.rawUrl.endsWith('-id.md') ? project.rawUrl.replace('-id.md', `-${lang}.md`) : project.rawUrl.replace('.md', `-${lang}.md`))
                : project.rawUrl))
            : project.rawUrl;
    }
}

if (!redirected) {
    setupTocDrawer();
    syncStickyOffset();
    window.addEventListener('resize', syncStickyOffset, { passive: true });
    loadArticle();

    // Safety net: the page always becomes readable, even if something stalls
    setTimeout(revealArticle, 6000);
}
