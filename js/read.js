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
        if (project) {
            if (lang === 'en') {
                repoUrl = project.rawUrlEn || (project.rawUrl && project.rawUrl.endsWith('-id.md') ? project.rawUrl.replace('-id.md', '-en.md') : project.rawUrl);
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

            // Fix relative markdown links biar nggak usah hardcode (Fitur Ajaib)
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

            // Dynamic Quote Logic for about-me.md
            const quoteElement = document.getElementById('dynamic-quote');
            if (quoteElement) {
                const quotes = [
                    { text: "Even if you're on the right track, you'll get run over if you just sit there.", author: "Will Rogers" },
                    { text: "If your dreams do not scare you, they are not big enough.", author: "Ellen Johnson Sirleaf" },
                    { text: "The two most important days in your life are the day you are born and the day you find out why.", author: "Mark Twain" },
                    { text: "The most common way people give up their power is by thinking they don't have any.", author: "Alice Walker" },
                    { text: "Tough times never last, but tough people do.", author: "Dr. Robert Schuller" },
                    { text: "Failure will never overtake me if my determination to succeed is strong enough.", author: "Og Mandino" },
                    { text: "It is said that your life flashes before your eyes just before you die. That is true, it's called Life.", author: "Terry Pratchett" },
                    { text: "UNIX is simple. It just takes a genius to understand its simplicity.", author: "Dennis Ritchie" },
                    { text: "The future is not laid out on a track. It is something that we can decide...", author: "Alan Kay" },
                    { text: "We cannot solve our problems with the same thinking we used when we created them.", author: "Albert Einstein" },
                    { text: "I know, somehow, that only when it is dark enough can you see the stars.", author: "Martin Luther King Jr." },
                    { text: "It ain't what you don't know that gets you into trouble. It's what you know for sure that just ain't so.", author: "Mark Twain" },
                    { text: "You cannot swim for new horizons until you have courage to lose sight of the shore.", author: "William Faulkner" },
                    { text: "Forever is composed of nows.", author: "Emily Dickinson" },
                    { text: "You can, you should, and if you're brave enough to start, you will.", author: "Stephen King" },
                    { text: "The past cannot be changed. The future is yet in your power.", author: "Confucius" },
                    { text: "I have no special talents. I am only passionately curious.", author: "Albert Einstein" },
                    { text: "A life spent making mistakes is not only more honorable, but more useful than a life spent doing nothing.", author: "George Bernard Shaw" },
                    { text: "Talk is cheap. Show me the code.", author: "Linus Torvalds" },
                    { text: "Programs must be written for people to read, and only incidentally for machines to execute.", author: "Harold Abelson" },
                    { text: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.", author: "Martin Fowler" },
                    { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
                    { text: "Experience is the name everyone gives to their mistakes.", author: "Oscar Wilde" },
                    { text: "In order to be irreplaceable, one must always be different.", author: "Coco Chanel" },
                    { text: "Knowledge is power.", author: "Francis Bacon" },
                    { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
                    { text: "Make it work, make it right, make it fast.", author: "Kent Beck" },
                    { text: "Before software can be reusable it first has to be usable.", author: "Ralph Johnson" },
                    { text: "Optimism is an occupational hazard of programming: feedback is the treatment.", author: "Kent Beck" },
                    { text: "It's not a bug - it's an undocumented feature.", author: "Anonymous" },
                    { text: "Measuring programming progress by lines of code is like measuring airplane building progress by weight.", author: "Bill Gates" },
                    { text: "I'm not a great programmer; I'm just a good programmer with great habits.", author: "Kent Beck" },
                    { text: "Truth can only be found in one place: the code.", author: "Robert C. Martin" },
                    { text: "If you automate a mess, you get an automated mess.", author: "Rod Michael" },
                    { text: "There is no Ctrl-Z in life.", author: "Anonymous" },
                    { text: "Security is a process, not a product.", author: "Bruce Schneier" },
                    { text: "If you think technology can solve your security problems, then you don't understand the problems and you don't understand the technology.", author: "Bruce Schneier" },
                    { text: "Amateurs hack systems, professionals hack people.", author: "Bruce Schneier" },
                    { text: "The only truly secure system is one that is powered off, cast in a block of concrete and sealed in a lead-lined room with armed guards.", author: "Gene Spafford" },
                    { text: "Companies spend millions of dollars on firewalls, encryption and secure access devices, and it's money wasted; none of these measures address the weakest link in the security chain.", author: "Kevin Mitnick" },
                    { text: "There are only two types of companies: those that have been hacked, and those that will be.", author: "Robert Mueller" },
                    { text: "Hardware is easy to protect: lock it in a room, chain it to a desk, or buy a spare. Information poses more of a problem.", author: "Bruce Schneier" },
                    { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
                    { text: "Stay hungry, stay foolish.", author: "Steve Jobs" },
                    { text: "If you define the problem correctly, you almost have the solution.", author: "Steve Jobs" },
                    { text: "It's fine to celebrate success but it is more important to heed the lessons of failure.", author: "Bill Gates" },
                    { text: "Success is a lousy teacher. It seduces smart people into thinking they can't lose.", author: "Bill Gates" },
                    { text: "Your most unhappy customers are your greatest source of learning.", author: "Bill Gates" },
                    { text: "Don't compare yourself with anyone in this world... if you do so, you are insulting yourself.", author: "Bill Gates" },
                    { text: "Whether you think you can or you think you can't, you're right.", author: "Henry Ford" },
                    { text: "The best way to predict your future is to create it.", author: "Abraham Lincoln" },
                    { text: "A person who never made a mistake never tried anything new.", author: "Albert Einstein" },
                    { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
                    { text: "I attribute my success to this: I never gave or took any excuse.", author: "Florence Nightingale" },
                    { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
                    { text: "The mind is everything. What you think you become.", author: "Buddha" },
                    { text: "An unexamined life is not worth living.", author: "Socrates" },
                    { text: "Eighty percent of success is showing up.", author: "Woody Allen" },
                    { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs" },
                    { text: "Winning isn't everything, but wanting to win is.", author: "Vince Lombardi" },
                    { text: "I am not a product of my circumstances. I am a product of my decisions.", author: "Stephen Covey" },
                    { text: "Every child is an artist. The problem is how to remain an artist once he grows up.", author: "Pablo Picasso" },
                    { text: "Either you run the day, or the day runs you.", author: "Jim Rohn" },
                    { text: "The two most powerful warriors are patience and time.", author: "Leo Tolstoy" },
                    { text: "He who has a why to live for can bear almost any how.", author: "Friedrich Nietzsche" },
                    { text: "What you do speaks so loudly that I cannot hear what you say.", author: "Ralph Waldo Emerson" },
                    { text: "You must be the change you wish to see in the world.", author: "Mahatma Gandhi" },
                    { text: "Keep your face always toward the sunshine - and shadows will fall behind you.", author: "Walt Whitman" },
                    { text: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt" },
                    { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
                    { text: "It is never too late to be what you might have been.", author: "George Eliot" },
                    { text: "If you tell the truth, you don't have to remember anything.", author: "Mark Twain" },
                    { text: "A room without books is like a body without a soul.", author: "Marcus Tullius Cicero" },
                    { text: "Be the change that you wish to see in the world.", author: "Mahatma Gandhi" },
                    { text: "In three words I can sum up everything I've learned about life: it goes on.", author: "Robert Frost" },
                    { text: "To live is the rarest thing in the world. Most people exist, that is all.", author: "Oscar Wilde" },
                    { text: "Without music, life would be a mistake.", author: "Friedrich Nietzsche" },
                    { text: "Always forgive your enemies; nothing annoys them so much.", author: "Oscar Wilde" },
                    { text: "We accept the love we think we deserve.", author: "Stephen Chbosky" },
                    { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
                    { text: "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.", author: "Ralph Waldo Emerson" },
                    { text: "It is better to be hated for what you are than to be loved for what you are not.", author: "Andre Gide" },
                    { text: "Good friends, good books, and a sleepy conscience: this is the ideal life.", author: "Mark Twain" },
                    { text: "We read to know we're not alone.", author: "William Nicholson" },
                    { text: "Everything you can imagine is real.", author: "Pablo Picasso" },
                    { text: "Sometimes the questions are complicated and the answers are simple.", author: "Dr. Seuss" },
                    { text: "Life is what happens to us while we are making other plans.", author: "Allen Saunders" },
                    { text: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas A. Edison" },
                    { text: "A reader lives a thousand lives before he dies. The man who never reads lives only one.", author: "George R.R. Martin" },
                    { text: "Never put off till tomorrow what may be done day after tomorrow just as well.", author: "Mark Twain" },
                    { text: "Logic will get you from A to Z; imagination will get you everywhere.", author: "Albert Einstein" },
                    { text: "There is no greater agony than bearing an untold story inside you.", author: "Maya Angelou" },
                    { text: "The man who does not read has no advantage over the man who cannot read.", author: "Mark Twain" },
                    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston S. Churchill" },
                    { text: "To love at all is to be vulnerable.", author: "C.S. Lewis" },
                    { text: "A day without sunshine is like, you know, night.", author: "Steve Martin" },
                    { text: "If you can't explain it to a six year old, you don't understand it yourself.", author: "Albert Einstein" },
                    { text: "The truth is, everyone is going to hurt you. You just got to find the ones worth suffering for.", author: "Bob Marley" }
                ];

                function renderRandomQuote() {
                    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
                    quoteElement.innerHTML = `<em>"${randomQuote.text}"</em> <br> — <strong>${randomQuote.author}</strong> <br><br>
                    <a href="#" id="change-quote-btn">[ ↻ Ganti Quote ]</a>`;

                    document.getElementById('change-quote-btn').addEventListener('click', function (e) {
                        e.preventDefault();
                        renderRandomQuote();
                    });
                }

                renderRandomQuote();
            }

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
                        let derivedUrlEn = p.rawUrlEn || (p.rawUrl && p.rawUrl.endsWith('-id.md') ? p.rawUrl.replace('-id.md', '-en.md') : null);
                        return p.rawUrl === repoUrl || derivedUrlEn === repoUrl;
                    });
                    if (project && project.giscus) {
                        giscusConfig = project.giscus;
                    }
                }

                if (giscusConfig) {
                    const script = document.createElement('script');
                    script.src = "https://giscus.app/client.js";
                    script.setAttribute("data-repo", giscusConfig.repo);
                    script.setAttribute("data-repo-id", giscusConfig.repoId);
                    script.setAttribute("data-category", giscusConfig.category);
                    script.setAttribute("data-category-id", giscusConfig.categoryId);
                    if (repoUrl.includes("about-me")) {
                        script.setAttribute("data-mapping", "pathname"); // Preserve legacy mapping for About Me page
                    } else {
                        script.setAttribute("data-mapping", "specific");
                        // Synchronize discussion threads across different language versions
                        // by using the primary localization URL (ID) as the common identifier.
                        let baseRawUrl = repoUrl.replace('-en.md', '-id.md');
                        let termUrl = window.location.origin + window.location.pathname + "?url=" + baseRawUrl;
                        script.setAttribute("data-term", termUrl);
                    }

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
            document.getElementById('content').innerHTML = "<p>Gagal memuat artikel.</p>";
        });
} else {
    document.getElementById('content').innerHTML = "<h1>Error 404</h1><p>Artikel tidak ditemukan.</p>";
}

// Fitur Share Artikel
function shareArticle() {
    const url = window.location.href;
    const title = document.title;

    if (navigator.share) {
        navigator.share({
            title: title,
            url: url
        }).catch(err => console.log('Share error:', err));
    } else {
        navigator.clipboard.writeText(url).then(() => {
            alert("Link artikel berhasil disalin ke clipboard!");
        }).catch(err => {
            alert("Gagal menyalin link: " + url);
        });
    }
}
