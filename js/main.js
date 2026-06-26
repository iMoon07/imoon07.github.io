const projectContainer = document.getElementById('project-container');
const recentContainer = document.getElementById('recent-container');
const catTitle = document.getElementById('cat-title');

async function fetchProjectData(project) {
    if (project.hasFetched) return project;
    project.hasFetched = true;

    const fetchSingle = async (url) => {
        if (!url) return null;
        try {
            const response = await fetch(url);
            const text = await response.text();
            
            const lastModified = response.headers.get('Last-Modified');
            let date = lastModified ? new Date(lastModified).getTime() : 0;

            let titleMatch = text.match(/^#\s+(.+)/m) || text.match(/<h1[^>]*>(.*?)<\/h1>/i);
            let title = titleMatch ? titleMatch[1].replace(/<[^>]*>?/gm, '').trim() : "Project Security";

            let descMatch = text.replace(/^#.*$/gm, '').match(/^[A-Za-z].*$/m);
            let desc = descMatch ? descMatch[0].replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').substring(0, 150) + "..." : "No description available.";

            return { title, desc, date, text };
        } catch (err) {
            return null;
        }
    };

    const idData = await fetchSingle(project.rawUrl);
    let derivedUrlEn = project.rawUrlEn || (project.rawUrl && project.rawUrl.endsWith('-id.md') ? project.rawUrl.replace('-id.md', '-en.md') : null);
    const enData = derivedUrlEn ? await fetchSingle(derivedUrlEn) : null;

    if (idData) {
        project.titleId = idData.title;
        project.descId = idData.desc;
        project.sortDate = project.publishedDate ? new Date(project.publishedDate).getTime() : idData.date;
        
        let formatterEn = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        project.displayDateEn = project.publishedDate ? formatterEn.format(new Date(project.publishedDate)) : "Unknown Date";
        let formatterId = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        project.displayDateId = project.publishedDate ? formatterId.format(new Date(project.publishedDate)) : "Tanggal Tidak Diketahui";

        
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

function renderProjects(initialCategory) {
    let isId = (window.currentLang === 'id');
    window.currentCategory = initialCategory;
    projectContainer.innerHTML = '';
    
    
    if (initialCategory === 'all') catTitle.innerText = "LATEST POSTS";
    else if (initialCategory === 'architecture') catTitle.innerText = "Security Architecture";
    else if (initialCategory === 'investigations') catTitle.innerText = "Investigations";
    else if (initialCategory === 'experiments') catTitle.innerText = "Experiments";


    let filteredData = myProjects;
    if (initialCategory !== 'all') {
        filteredData = filteredData.filter(project => project.category === initialCategory);
    }

    if (filteredData.length === 0) {
        let noDataText = isId ? "Belum ada tulisan di kategori ini." : "No articles in this category yet.";
        projectContainer.innerHTML = `<p><i>${noDataText}</i></p>`;
        return;
    }

    filteredData.forEach((project) => {
        let title = isId ? project.titleId : project.titleEn;
        let desc = isId ? project.descId : project.descEn;
        let postUrl = `read.html?post=${project.id}${isId ? '' : '&lang=en'}`;

        let cardHtml = `
            <div class="kotak-preview">
                <img src="${project.image}" onerror="this.onerror=null; this.src='data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'600\\' height=\\'300\\' viewBox=\\'0 0 600 300\\'%3E%3Crect fill=\\'%23161b22\\' width=\\'600\\' height=\\'300\\'/%3E%3Ctext fill=\\'%23c9d1d9\\' x=\\'50%25\\' y=\\'50%25\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' font-family=\\'sans-serif\\' font-size=\\'24\\'%3ENo Image%3C/text%3E%3C/svg%3E'">
                <div style="font-size: 13px; color: #8b949e; margin-top: 12px; display: flex; align-items: center; gap: 6px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    ${isId ? project.displayDateId : project.displayDateEn}
                </div>
                <h2 style="margin-top: 8px;"><a href="${postUrl}">${title}</a></h2>
                <p>${desc}</p>
                <a href="${postUrl}">${isId ? "Baca Selengkapnya..." : "Continue Reading..."}</a>
            </div>
        `;
        projectContainer.innerHTML += cardHtml;
    });
}

async function initEngine() {
    projectContainer.innerHTML = "<p><i>Loading data...</i></p>";
    recentContainer.innerHTML = "<li><i>Loading...</i></li>";

    await Promise.all(myProjects.map(p => fetchProjectData(p)));

    myProjects.sort((a, b) => b.sortDate - a.sortDate);

    recentContainer.innerHTML = '';
    myProjects.slice(0, 10).forEach(project => {
        let isId = (window.currentLang === 'id');
        let title = isId ? project.titleId : project.titleEn;
        let postUrl = `read.html?post=${project.id}${isId ? '' : '&lang=en'}`;
        let listHtml = `<li style="margin-bottom:12px;"><a href="${postUrl}">${title}</a></li>`;
        recentContainer.innerHTML += listHtml;
    });

    renderProjects('all');
}

// Initialize application
initEngine();
