const projectContainer = document.getElementById('project-container');
const recentContainer = document.getElementById('recent-container');
const catTitle = document.getElementById('cat-title');

async function fetchProjectData(project) {
    if (project.title) return project;

    try {
        const response = await fetch(project.rawUrl);
        const text = await response.text();
        
        const lastModified = response.headers.get('Last-Modified');
        project.date = lastModified ? new Date(lastModified).getTime() : 0;

        let titleMatch = text.match(/^#\s+(.+)/m) || text.match(/<h1[^>]*>(.*?)<\/h1>/i);
        if (titleMatch) {
            project.title = titleMatch[1].replace(/<[^>]*>?/gm, '').trim();
        } else {
            let urlParts = project.rawUrl.split('/');
            project.title = urlParts.length >= 3 ? urlParts[urlParts.length - 3] : "Project Security";
        }

        let descMatch = text.replace(/^#.*$/gm, '').match(/^[A-Za-z].*$/m);
        project.desc = descMatch ? descMatch[0].substring(0, 150) + "..." : "Tidak ada deskripsi.";

        // Extract first valid image for preview
        let foundImgUrl = null;
        let allImages = [];
        
        // Extract HTML images
        const htmlImgRegex = /<img[^>]*src=["']([^"']+)["']/gi;
        let match;
        while ((match = htmlImgRegex.exec(text)) !== null) { allImages.push(match[1]); }
        
        // Extract Markdown images
        const mdImgRegex = /!\[[^\]]*\]\(([^)]+)\)/gi;
        while ((match = mdImgRegex.exec(text)) !== null) { allImages.push(match[1]); }

        // Find the first image that is not a badge
        for (let img of allImages) {
            let lowerImg = img.toLowerCase();
            if (!lowerImg.includes('shields.io') && 
                !lowerImg.includes('badge') && 
                !lowerImg.includes('actions/workflows') &&
                !lowerImg.includes('travis-ci')) {
                foundImgUrl = img;
                break;
            }
        }
        
        if (foundImgUrl && !foundImgUrl.startsWith('http')) {
            let basePath = project.rawUrl.substring(0, project.rawUrl.lastIndexOf('/') + 1);
            foundImgUrl = basePath + foundImgUrl;
        }
        
        const fallbackSvg = (txt) => `data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='300' viewBox='0 0 600 300'%3E%3Crect fill='%23161b22' width='600' height='300'/%3E%3Ctext fill='%23c9d1d9' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='24'%3E${encodeURIComponent(txt)}%3C/text%3E%3C/svg%3E`;
        
        project.image = foundImgUrl || fallbackSvg(project.title);

    } catch (err) {
        project.title = project.rawUrl.split('/').pop();
        project.desc = "Gagal memuat artikel otomatis.";
        project.image = `data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='300' viewBox='0 0 600 300'%3E%3Crect fill='%23161b22' width='600' height='300'/%3E%3Ctext fill='%23c9d1d9' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='24'%3EError%3C/text%3E%3C/svg%3E`;
        project.date = 0;
    }
    return project;
}

function renderProjects(kategoriAwal) {
    projectContainer.innerHTML = '';
    
    if (kategoriAwal === 'all') catTitle.innerText = "LATEST POSTS";
    else if (kategoriAwal === 'architect') catTitle.innerText = "Cyber Security Architect";
    else if (kategoriAwal === 'teaming') catTitle.innerText = "Red/Blue/Purple Teaming";
    else if (kategoriAwal === 'malware') catTitle.innerText = "Exploit/Malware Analysis";

    let dataTerfilter = myProjects;
    if (kategoriAwal !== 'all') {
        dataTerfilter = dataTerfilter.filter(project => project.category === kategoriAwal);
    }

    if (dataTerfilter.length === 0) {
        projectContainer.innerHTML = "<p><i>Belum ada tulisan di kategori ini.</i></p>";
        return;
    }

    dataTerfilter.forEach((project) => {
        let kotakHtml = `
            <div class="kotak-preview">
                <img src="${project.image}" onerror="this.onerror=null; this.src='data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'600\\' height=\\'300\\' viewBox=\\'0 0 600 300\\'%3E%3Crect fill=\\'%23161b22\\' width=\\'600\\' height=\\'300\\'/%3E%3Ctext fill=\\'%23c9d1d9\\' x=\\'50%25\\' y=\\'50%25\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' font-family=\\'sans-serif\\' font-size=\\'24\\'%3ENo Image%3C/text%3E%3C/svg%3E'">
                <h2><a href="read.html?url=${project.rawUrl}">${project.title}</a></h2>
                <p>${project.desc}</p>
                <a href="read.html?url=${project.rawUrl}">Continue Reading...</a>
            </div>
        `;
        projectContainer.innerHTML += kotakHtml;
    });
}

async function initMesinOtomatis() {
    projectContainer.innerHTML = "<p><i>Loading data otomatis...</i></p>";
    recentContainer.innerHTML = "<li><i>Loading...</i></li>";

    await Promise.all(myProjects.map(p => fetchProjectData(p)));

    myProjects.sort((a, b) => b.date - a.date);

    recentContainer.innerHTML = '';
    myProjects.slice(0, 10).forEach(project => {
        let listHtml = `<li style="margin-bottom:12px;"><a href="read.html?url=${project.rawUrl}">${project.title}</a></li>`;
        recentContainer.innerHTML += listHtml;
    });

    renderProjects('all');
}

// Initialize application
initMesinOtomatis();
