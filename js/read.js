const urlParams = new URLSearchParams(window.location.search);
let postId = urlParams.get('post');
const lang = urlParams.get('lang') || 'id';

if (!postId && window.location.pathname.endsWith('about.html')) {
    postId = 'about-me';
}

let repoUrl = urlParams.get('url');

if (postId) {
    if (postId === 'about-me') {
        repoUrl = lang === 'en' ? 'content/about-me.md' : 'content/about-me-id.md';
    } else if (typeof myProjects !== 'undefined') {
        const project = myProjects.find(p => p.id === postId);
        // STRICT: project harus ada DAN punya id yang valid
        if (project && project.id && typeof project.id === 'string' && project.id.trim() !== '') {
            const dateContainer = document.getElementById('article-date-container');
            if (dateContainer && project.publishedDate) {
                let formatterEn = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                let formatterId = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                
                let pubStr = lang === 'en' ? formatterEn.format(new Date(project.publishedDate)) : formatterId.format(new Date(project.publishedDate));
                let htmlStr = `<div style="margin-bottom: 2px;">${lang === 'en' ? 'Posted:' : 'Diposting:'} <strong>${pubStr}</strong></div>`;
                
                if (project.lastEditedDate && project.lastEditedDate !== project.publishedDate) {
                    let editStr = lang === 'en' ? formatterEn.format(new Date(project.lastEditedDate)) : formatterId.format(new Date(project.lastEditedDate));
                    htmlStr += `<div>${lang === 'en' ? 'Last edited:' : 'Terakhir diedit:'} ${editStr}</div>`;
                }
                
                dateContainer.innerHTML = htmlStr;
                dateContainer.style.display = 'block';
            }

            if (lang === 'en') {
                repoUrl = project.rawUrlEn || (project.rawUrl ? (project.rawUrl.endsWith('-id.md') ? project.rawUrl.replace('-id.md', '-en.md') : project.rawUrl.replace('.md', '-en.md')) : project.rawUrl);
            } else {
                repoUrl = project.rawUrl;
            }
        }
    }
}

if (repoUrl && repoUrl !== '#') {
    document.getElementById('content').innerHTML = "<p><i>Fetching data from GitHub...</i></p>";
    fetch(repoUrl)
        .then(response => response.text())
        .then(text => {
            // Fix relative image paths
            let basePath = repoUrl.substring(0, repoUrl.lastIndexOf('/') + 1);
            text = text.replace(/!\[([^\]]*)\]\((?!http)(.*?)\)/g, "![$1](" + basePath + "$2)");
            text = text.replace(/<img([^>]*?)src=["'](?!http)(.*?)["']/gi, "<img$1src=\"" + basePath + "$2\"");

            // Fix relative markdown links dynamically to avoid hardcoding
            text = text.replace(/(?<!!)\[([^\]]+)\]\((?!http|#|mailto:)(.*?\.md)\)/g, (match, p1, p2) => {
                if (postId) {
                    if (postId === 'about-me') {
                        if (p2.includes('-id.md')) return `[${p1}](read.html?post=about-me)`;
                        if (p2.includes('.md')) return `[${p1}](read.html?post=about-me&lang=en)`;
                    } else {
                        if (p2.includes('-en.md')) return `[${p1}](read.html?post=${postId}&lang=en)`;
                        if (p2.includes('-id.md')) return `[${p1}](read.html?post=${postId})`;
                    }
                }
                return `[${p1}](read.html?url=${basePath}${p2})`;
            });

            document.getElementById('content').innerHTML = marked.parse(text);
            
            /*
            // Dynamic Quote Logic for about-me.md
            const quoteElement = document.getElementById('dynamic-quote');
            if (quoteElement) {
                const quotes = [
                ];

                function renderRandomQuote() {
                    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
                    quoteElement.innerHTML = `<em>"${randomQuote.text}"</em> <br> — <strong>${randomQuote.author}</strong> <br><br>
                    <a href="#" id="change-quote-btn">[ ↻ Change Quote ]</a>`;

                    document.getElementById('change-quote-btn').addEventListener('click', function (e) {
                        e.preventDefault();
                        renderRandomQuote();
                    });
                }

                renderRandomQuote();
            }
*/

            // Dynamic Giscus Injection
            const giscusWrapper = document.getElementById('giscus-wrapper');
            if (giscusWrapper) {
                let giscusConfig = null;

                if (repoUrl.includes("about-me")) {
                    // Specific configuration for About Me page (not included in myProjects)
                    giscusConfig = {
                        repo: "iMoon07/imoon07.github.io",
                        repoId: "R_kgDOPC4SPw",
                        category: "General",
                        categoryId: "DIC_kwDOPC4SP84C_u9G"
                    };
                } else if (typeof myProjects !== 'undefined') {
                    // Dynamically resolve project configuration for both localizations (ID and EN)
                    const project = myProjects.find(p => {
                        let derivedUrlEn = p.rawUrlEn || (p.rawUrl ? (p.rawUrl.endsWith('-id.md') ? p.rawUrl.replace('-id.md', '-en.md') : p.rawUrl.replace('.md', '-en.md')) : null);
                        return p.rawUrl === repoUrl || derivedUrlEn === repoUrl;
                    });
                    if (project) {
                        giscusConfig = project.giscus || {
                            repo: "iMoon07/Penjelajah-CyberSecurity",
                            repoId: "R_kgDOTDbgbA",
                            category: "Q&A",
                            categoryId: "DIC_kwDOTDbgbM4C_xMv"
                        };
                    }
                }

                if (giscusConfig) {
                    const script = document.createElement('script');
                    script.src = "https://giscus.app/client.js";
                    script.setAttribute("data-repo", giscusConfig.repo);
                    script.setAttribute("data-repo-id", giscusConfig.repoId);
                    script.setAttribute("data-category", giscusConfig.category);
                    script.setAttribute("data-category-id", giscusConfig.categoryId);
                    script.setAttribute("data-mapping", "specific");
                    script.setAttribute("data-term", postId || "General-Discussion");

                    script.setAttribute("data-strict", "0");
                    script.setAttribute("data-reactions-enabled", "1");
                    script.setAttribute("data-emit-metadata", "0");
                    script.setAttribute("data-input-position", "bottom");
                    const isLightMode = document.body.classList.contains('light-mode');
                    script.setAttribute("data-theme", isLightMode ? "light" : "dark");
                    script.setAttribute("data-lang", "en");
                    script.crossOrigin = "anonymous";
                    script.async = true;

                    giscusWrapper.appendChild(script);
                }
            }
        })
        .catch(err => {
            document.getElementById('content').innerHTML = "<p>Failed to load the article.</p>";
        });
} else {
    document.getElementById('content').innerHTML = "<h1>Error 404</h1><p>Article not found.</p>";
}

// Article Share Feature
function shareArticle() {
    const url = window.location.href;
    const title = document.title;

    if (navigator.share) {
        navigator.share({
            title: title,
            url: url
        }).catch(err => console.error('Share error:', err));
    } else {
        navigator.clipboard.writeText(url).then(() => {
            alert("Article link successfully copied to clipboard!");
        }).catch(err => {
            alert("Failed to copy link: " + url);
        });
    }
}
