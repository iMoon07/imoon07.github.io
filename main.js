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
            let desc = descMatch ? descMatch[0].substring(0, 150) + "..." : "No description available.";

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
        project.date = idData.date;
        
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
        project.date = 0;
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

function renderProjects(kategoriAwal) {
    window.currentCategory = kategoriAwal;
    projectContainer.innerHTML = '';
    
    const isId = (window.currentLang === 'id');
    
    if (kategoriAwal === 'all') catTitle.innerText = isId ? "POSTINGAN TERBARU" : "LATEST POSTS";
    else if (kategoriAwal === 'architect') catTitle.innerText = "Cyber Security Architect";
    else if (kategoriAwal === 'teaming') catTitle.innerText = "Red/Blue/Purple Teaming";
    else if (kategoriAwal === 'malware') catTitle.innerText = "Exploit/Malware Analysis";

    let dataTerfilter = myProjects;
    if (kategoriAwal !== 'all') {
        dataTerfilter = dataTerfilter.filter(project => project.category === kategoriAwal);
    }

    if (dataTerfilter.length === 0) {
        let noDataText = isId ? "Belum ada tulisan di kategori ini." : "No articles in this category yet.";
        projectContainer.innerHTML = `<p><i>${noDataText}</i></p>`;
        return;
    }

    dataTerfilter.forEach((project) => {
        let title = isId ? project.titleId : project.titleEn;
        let desc = isId ? project.descId : project.descEn;
        let derivedUrlEn = project.rawUrlEn || (project.rawUrl && project.rawUrl.endsWith('-id.md') ? project.rawUrl.replace('-id.md', '-en.md') : null);
        let url = isId ? project.rawUrl : (derivedUrlEn || project.rawUrl);

        let kotakHtml = `
            <div class="kotak-preview">
                <img src="${project.image}" onerror="this.onerror=null; this.src='data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'600\\' height=\\'300\\' viewBox=\\'0 0 600 300\\'%3E%3Crect fill=\\'%23161b22\\' width=\\'600\\' height=\\'300\\'/%3E%3Ctext fill=\\'%23c9d1d9\\' x=\\'50%25\\' y=\\'50%25\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' font-family=\\'sans-serif\\' font-size=\\'24\\'%3ENo Image%3C/text%3E%3C/svg%3E'">
                <h2><a href="read.html?url=${url}">${title}</a></h2>
                <p>${desc}</p>
                <a href="read.html?url=${url}">${isId ? "Baca Selengkapnya..." : "Continue Reading..."}</a>
            </div>
        `;
        projectContainer.innerHTML += kotakHtml;
    });
}

async function initMesinOtomatis() {
    projectContainer.innerHTML = "<p><i>Loading data...</i></p>";
    recentContainer.innerHTML = "<li><i>Loading...</i></li>";

    await Promise.all(myProjects.map(p => fetchProjectData(p)));

    myProjects.sort((a, b) => b.date - a.date);

    recentContainer.innerHTML = '';
    myProjects.slice(0, 10).forEach(project => {
        let isId = (window.currentLang === 'id');
        let title = isId ? project.titleId : project.titleEn;
        let derivedUrlEn = project.rawUrlEn || (project.rawUrl && project.rawUrl.endsWith('-id.md') ? project.rawUrl.replace('-id.md', '-en.md') : null);
        let url = isId ? project.rawUrl : (derivedUrlEn || project.rawUrl);
        let listHtml = `<li style="margin-bottom:12px;"><a href="read.html?url=${url}">${title}</a></li>`;
        recentContainer.innerHTML += listHtml;
    });

    renderProjects('all');
}

// Initialize application
initMesinOtomatis();
