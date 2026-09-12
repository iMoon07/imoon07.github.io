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
                    { text: "The truth is, everyone is going to hurt you. You just got to find the ones worth suffering for.", author: "Bob Marley" },
                    { text: "静以修身，俭以养德。\nJìng yǐ xiū shēn, jiǎn yǐ yǎng dé.\nMenenangkan diri untuk membina diri, hidup sederhana untuk memelihara kebajikan.", author: "诸葛亮" },
                    { text: "非淡泊无以明志，非宁静无以致远。\nFēi dàn bó wú yǐ míng zhì, fēi níng jìng wú yǐ zhì yuǎn.\nTanpa ketenangan dan kesederhanaan, seseorang tidak dapat menetapkan tujuan yang jelas dan mencapai cita-cita yang jauh.", author: "诸葛亮" },
                    { text: "吾日三省吾身。\nWú rì sān xǐng wú shēn.\nSetiap hari aku memeriksa dan mengevaluasi diriku sendiri.", author: "曾子" },
                    { text: "道虽迩，不行不至；事虽小，不为不成。\nDào suī ěr, bù xíng bù zhì; shì suī xiǎo, bù wéi bù chéng.\nJalan mungkin dekat, tetapi tanpa melangkah kau tidak akan sampai; perkara mungkin kecil, tetapi tanpa dilakukan tidak akan selesai.", author: "荀子" },
                    { text: "工欲善其事，必先利其器。\nGōng yù shàn qí shì, bì xiān lì qí qì.\nJika ingin melakukan pekerjaan dengan baik, terlebih dahulu siapkan alat yang tepat.", author: "孔子" },
                    { text: "胜人者有力，自胜者强。\nShèng rén zhě yǒu lì, zì shèng zhě qiáng.\nOrang yang mengalahkan orang lain memiliki kekuatan; orang yang mampu mengalahkan dirinya sendiri benar-benar kuat.", author: "老子" },
                    { text: "苟日新，日日新，又日新。\nGǒu rì xīn, rì rì xīn, yòu rì xīn.\nJika hari ini berubah menjadi lebih baik, teruslah memperbarui diri setiap hari.", author: "《大学》" },
                    { text: "不积跬步，无以至千里；不积小流，无以成江海。\nBù jī kuǐ bù, wú yǐ zhì qiān lǐ; bù jī xiǎo liú, wú yǐ chéng jiāng hǎi.\nTanpa mengumpulkan langkah-langkah kecil, seseorang tidak akan mencapai ribuan li; tanpa mengumpulkan aliran kecil, tidak akan terbentuk sungai dan lautan.", author: "荀子" },
                    { text: "见贤思齐焉，见不贤而内自省也。\nJiàn xián sī qí yān, jiàn bù xián ér nèi zì xǐng yě.\nKetika melihat orang yang baik, berusahalah menyamainya; ketika melihat orang yang buruk, periksalah dirimu sendiri.", author: "孔子" },
                    { text: "学而不思则罔，思而不学则殆。\nXué ér bù sī zé wǎng, sī ér bù xué zé dài.\nBelajar tanpa berpikir membuatmu tersesat; berpikir tanpa belajar membuatmu berada dalam bahaya.", author: "孔子" },
                    { text: "反求诸己。\nFǎn qiú zhū jǐ.\nKetika menghadapi masalah, carilah jawabannya terlebih dahulu dalam diri sendiri.", author: "孟子" },
                    { text: "知人者智，自知者明。\nZhī rén zhě zhì, zì zhī zhě míng.\nMengenal orang lain adalah kebijaksanaan; mengenal diri sendiri adalah kejernihan.", author: "老子" },
                    { text: "千里之行，始于足下。\nQiān lǐ zhī xíng, shǐ yú zú xià.\nPerjalanan seribu li dimulai dari satu langkah.", author: "老子" },
                    { text: "天行健，君子以自强不息。\nTiān xíng jiàn, jūn zǐ yǐ zì qiáng bù xī.\nSebagaimana langit terus bergerak dengan kuat, seorang yang luhur harus terus memperkuat dan memperbaiki dirinya tanpa berhenti.", author: "《周易》" },
                    { text: "君子求诸己，小人求诸人。\nJūn zǐ qiú zhū jǐ, xiǎo rén qiú zhū rén.\nOrang yang berbudi mencari kesalahan dan solusi dalam dirinya; orang yang rendah menyalahkan orang lain.", author: "孔子" },
                    { text: "过而不改，是谓过矣。\nGuò ér bù gǎi, shì wèi guò yǐ.\nMelakukan kesalahan bukanlah kesalahan terbesar; tidak memperbaikinya itulah kesalahan.", author: "孔子" },
                    { text: "三人行，必有我师焉。\nSān rén xíng, bì yǒu wǒ shī yān.\nDi antara tiga orang yang berjalan bersama, pasti ada sesuatu yang dapat kupelajari dari salah satunya.", author: "孔子" },
                    { text: "敏而好学，不耻下问。\nMǐn ér hào xué, bù chǐ xià wèn.\nCepat belajar dan gemar belajar, serta tidak malu bertanya kepada siapa pun.", author: "孔子" },
                    { text: "不怨天，不尤人。\nBù yuàn tiān, bù yóu rén.\nJangan menyalahkan keadaan dan jangan menyalahkan orang lain.", author: "孔子" },
                    { text: "玉不琢，不成器；人不学，不知道。\nYù bù zhuó, bù chéng qì; rén bù xué, bù zhī dào.\nGiok tanpa diasah tidak menjadi benda berharga; manusia tanpa belajar tidak memahami jalan kehidupan.", author: "《礼记》" },
                    { text: "博学之，审问之，慎思之，明辨之，笃行之。\nBó xué zhī, shěn wèn zhī, shèn sī zhī, míng biàn zhī, dǔ xíng zhī.\nBelajarlah secara luas, bertanyalah dengan teliti, pikirkan dengan hati-hati, bedakan dengan jelas, lalu praktikkan dengan sungguh-sungguh.", author: "《礼记》" },
                    { text: "路漫漫其修远兮，吾将上下而求索。\nLù màn màn qí xiū yuǎn xī, wú jiāng shàng xià ér qiú suǒ.\nJalannya masih panjang dan jauh; aku akan terus mencari dan menjelajah ke segala arah.", author: "屈原" },
                    { text: "锲而舍之，朽木不折；锲而不舍，金石可镂。\nQiè ér shě zhī, xiǔ mù bù zhé; qiè ér bù shě, jīn shí kě lòu.\nJika berhenti di tengah jalan, kayu lapuk pun tidak akan terukir; jika tidak menyerah, bahkan logam dan batu dapat diukir.", author: "荀子" },
                    { text: "学不可以已。\nXué bù kě yǐ yǐ.\nBelajar tidak boleh berhenti.", author: "荀子" },
                    { text: "慎终如始，则无败事。\nShèn zhōng rú shǐ, zé wú bài shì.\nJika tetap berhati-hati hingga akhir seperti ketika memulai, tidak akan banyak urusan yang gagal.", author: "老子" },
                    { text: "为之于未有，治之于未乱。\nWéi zhī yú wèi yǒu, zhì zhī yú wèi luàn.\nTangani sesuatu sebelum masalah muncul dan atasi kekacauan sebelum terjadi.", author: "老子" },
                    { text: "上善若水，水善利万物而不争。\nShàng shàn ruò shuǐ, shuǐ shàn lì wàn wù ér bù zhēng.\nKebaikan tertinggi seperti air; air memberi manfaat kepada segala sesuatu tanpa bersaing.", author: "老子" },
                    { text: "善战者，不怒。\nShàn zhàn zhě, bù nù.\nOrang yang pandai berperang tidak mudah dikuasai amarah.", author: "孙子" },
                    { text: "不战而屈人之兵，善之善者也。\nBù zhàn ér qū rén zhī bīng, shàn zhī shàn zhě yě.\nMenundukkan lawan tanpa harus berperang adalah bentuk kemenangan yang paling baik.", author: "孙子" },
                    { text: "知彼知己，百战不殆。\nZhī bǐ zhī jǐ, bǎi zhàn bù dài.\nKenali lawan dan kenali diri sendiri, maka dalam seratus pertempuran pun tidak akan mudah dikalahkan.", author: "孙子" },
                    { text: "故善战者致人，而不致于人。\nGù shàn zhàn zhě zhì rén, ér bù zhì yú rén.\nKarena itu, ahli strategi membuat lawan mengikuti kehendaknya, bukan dirinya yang dikendalikan lawan.", author: "孙子" },
                    { text: "将者，智、信、仁、勇、严也。\nJiàng zhě, zhì, xìn, rén, yǒng, yán yě.\nSeorang pemimpin harus memiliki kecerdasan, dapat dipercaya, berbelas kasih, berani, dan tegas.", author: "孙子" },
                    { text: "修己以敬，修己以安百姓。\nXiū jǐ yǐ jìng, xiū jǐ yǐ ān bǎi xìng.\nPerbaikilah diri dengan penuh kesungguhan; dengan memperbaiki diri, bawalah ketenteraman bagi orang lain.", author: "孔子" },
                    { text: "己欲立而立人，己欲达而达人。\nJǐ yù lì ér lì rén, jǐ yù dá ér dá rén.\nJika ingin tegak dan berhasil, bantulah orang lain agar dapat tegak dan berhasil pula.", author: "孔子" },
                    { text: "己所不欲，勿施于人。\nJǐ suǒ bù yù, wù shī yú rén.\nApa yang tidak ingin kamu terima dari orang lain, jangan lakukan kepada orang lain.", author: "孔子" },
                    { text: "仁者无敌。\nRén zhě wú dí.\nOrang yang benar-benar berbelas kasih tidak memiliki musuh.", author: "孟子" },
                    { text: "得道者多助，失道者寡助。\nDé dào zhě duō zhù, shī dào zhě guǎ zhù.\nOrang yang berada di jalan yang benar akan mendapat banyak dukungan; yang kehilangan jalan yang benar akan mendapat sedikit dukungan.", author: "孟子" },
                    { text: "天时不如地利，地利不如人和。\nTiān shí bù rú dì lì, dì lì bù rú rén hé.\nWaktu yang tepat tidak sebaik kondisi tempat yang menguntungkan; tempat yang menguntungkan tidak sebaik persatuan manusia.", author: "孟子" },
                    { text: "生于忧患，死于安乐。\nShēng yú yōu huàn, sǐ yú ān lè.\nManusia tumbuh melalui kesulitan dan dapat binasa karena terlalu larut dalam kenyamanan.", author: "孟子" },
                    { text: "穷则独善其身，达则兼善天下。\nQióng zé dú shàn qí shēn, dá zé jiān shàn tiān xià.\nKetika berada dalam kesulitan, perbaikilah dirimu; ketika telah mampu, berikan manfaat kepada dunia.", author: "孟子" },
                    { text: "富贵不能淫，贫贱不能移，威武不能屈。\nFù guì bù néng yín, pín jiàn bù néng yí, wēi wǔ bù néng qū.\nKekayaan tidak boleh membuatmu terlena, kemiskinan tidak boleh menggoyahkanmu, dan kekuasaan tidak boleh membuatmu tunduk.", author: "孟子" },
                    { text: "士虽有学，而行为本焉。\nShì suī yǒu xué, ér xíng wéi běn yān.\nWalaupun seseorang memiliki ilmu, tindakan tetap menjadi dasarnya.", author: "墨子" },
                    { text: "知足不辱，知止不殆。\nZhī zú bù rǔ, zhī zhǐ bù dài.\nMengetahui kapan merasa cukup menghindarkan kehinaan; mengetahui kapan harus berhenti menghindarkan bahaya.", author: "老子" },
                    
                    { text: "客户第一，员工第二，股东第三。\nKèhù dì yī, yuángōng dì èr, gǔdōng dì sān.\nPelanggan pertama, karyawan kedua, pemegang saham ketiga.", author: "马云" },
                    { text: "如果地上有九只兔子，你想抓住一只，就只盯住一只。\nRúguǒ dì shàng yǒu jiǔ zhī tùzi, nǐ xiǎng zhuā zhù yì zhī, jiù zhǐ dīng zhù yì zhī.\nJika ada sembilan kelinci di tanah dan kau ingin menangkap satu, fokuslah hanya pada satu.", author: "马云" },
                    { text: "不要改变兔子，要改变自己，直到抓住兔子。\nBú yào gǎibiàn tùzi, yào gǎibiàn zìjǐ, zhídào zhuā zhù tùzi.\nJangan mencoba mengubah kelinci; ubahlah dirimu sampai mampu menangkapnya.", author: "马云" },
                    { text: "今天很残酷，明天更残酷，后天很美好。\nJīntiān hěn cánkù, míngtiān gèng cánkù, hòutiān hěn měihǎo.\nHari ini kejam, besok lebih kejam, tetapi lusa akan indah.", author: "马云" },
                    { text: "我们永远不会放弃，因为我们年轻。\nWǒmen yǒngyuǎn bù huì fàngqì, yīnwèi wǒmen niánqīng.\nKami tidak akan pernah menyerah, karena kami masih muda.", author: "马云" },
                    { text: "帮助年轻人，帮助小人物，因为小人物会变大。\nBāngzhù niánqīng rén, bāngzhù xiǎo rénwù, yīnwèi xiǎo rénwù huì biàn dà.\nBantulah orang muda dan orang kecil, karena orang kecil dapat tumbuh menjadi besar.", author: "马云" },
                    { text: "科技是一种能力，做好科技是一种选择。\nKējì shì yì zhǒng nénglì, zuò hǎo kējì shì yì zhǒng xuǎnzé.\nTeknologi adalah sebuah kemampuan; menggunakan teknologi dengan baik adalah sebuah pilihan.", author: "马化腾" },
                    { text: "财富不会给你满足感，创造一个受到用户欢迎的好产品才是最重要的。\nCáifù bú huì gěi nǐ mǎnzúgǎn, chuàngzào yí ge shòudào yònghù huānyíng de hǎo chǎnpǐn cái shì zuì zhòngyào de.\nKekayaan tidak akan memberimu kepuasan; yang paling penting adalah menciptakan produk bagus yang diterima pengguna.", author: "马化腾" },
                    { text: "复制别人不能让你变得伟大，关键是本土化创新。\nFùzhì biérén bù néng ràng nǐ biàn dé wěidà, guānjiàn shì běntǔhuà chuàngxīn.\nMeniru orang lain tidak akan membuatmu hebat; kuncinya adalah inovasi yang disesuaikan dengan kebutuhan sendiri.", author: "马化腾" },
                    { text: "互联网是一个连接器。\nHùliánwǎng shì yí ge liánjiēqì.\nInternet adalah sebuah penghubung.", author: "马化腾" },
                    { text: "我们相信数字化的力量，也必须思考技术的伦理。\nWǒmen xiāngxìn shùzìhuà de lìliàng, yě bìxū sīkǎo jìshù de lúnlǐ.\nKami percaya pada kekuatan digitalisasi, tetapi juga harus memikirkan etika teknologi.", author: "马化腾" },
                    { text: "永远不要只走一条路。\nYǒngyuǎn bú yào zhǐ zǒu yì tiáo lù.\nJangan pernah hanya menempuh satu jalan.", author: "张瑞敏" },
                    { text: "创新就是用新的方式为用户创造价值。\nChuàngxīn jiù shì yòng xīn de fāngshì wèi yònghù chuàngzào jiàzhí.\nInovasi adalah menggunakan cara baru untuk menciptakan nilai bagi pengguna.", author: "张瑞敏" },
                    { text: "我们总是认为自己是错的，而不是对的。\nWǒmen zǒng shì rènwéi zìjǐ shì cuò de, ér bú shì duì de.\nKami selalu menganggap diri kami mungkin salah, bukan selalu benar.", author: "张瑞敏" },
                    { text: "企业要随着时代变化而改变自己。\nQǐyè yào suízhe shídài biànhuà ér gǎibiàn zìjǐ.\nPerusahaan harus mengubah dirinya mengikuti perubahan zaman.", author: "张瑞敏" },
                    { text: "员工不应该只是执行者，而应该能够通过决策实现自己的价值。\nYuángōng bù yīnggāi zhǐ shì zhíxíngzhě, ér yīnggāi nénggòu tōngguò juécè shíxiàn zìjǐ de jiàzhí.\nKaryawan tidak seharusnya hanya menjadi pelaksana, tetapi harus mampu mewujudkan nilainya melalui pengambilan keputusan.", author: "张瑞敏" },
                    { text: "企业的价值最终来自创造用户。\nQǐyè de jiàzhí zuìzhōng láizì chuàngzào yònghù.\nNilai sebuah perusahaan pada akhirnya berasal dari menciptakan dan mempertahankan pengguna.", author: "张瑞敏" },
                    { text: "我们不能封闭，必须保持开放。\nWǒmen bù néng fēngbì, bìxū bǎochí kāifàng.\nKita tidak boleh menutup diri; kita harus tetap terbuka.", author: "任正非" },
                    { text: "困难意味着我们做了一些别人做不到的事情，也证明了我们的价值。\nKùnnan yìwèizhe wǒmen zuòle yìxiē biérén zuò bú dào de shìqing, yě zhèngmíngle wǒmen de jiàzhí.\nKesulitan berarti kita melakukan sesuatu yang tidak mampu dilakukan orang lain, dan itu membuktikan nilai kita.", author: "任正非" },
                    { text: "历史上没有哪一步前进是容易的。\nLìshǐ shàng méiyǒu nǎ yí bù qiánjìn shì róngyì de.\nTidak ada satu pun langkah kemajuan dalam sejarah yang mudah.", author: "任正非" },
                    { text: "学术自由是创新的基础。\nXuéshù zìyóu shì chuàngxīn de jīchǔ.\nKebebasan akademik adalah dasar dari inovasi.", author: "任正非" },
                    { text: "工程师应该专注于开发好产品。\nGōngchéngshī yīnggāi zhuānzhù yú kāifā hǎo chǎnpǐn.\nInsinyur seharusnya fokus mengembangkan produk yang baik.", author: "任正非" },
                    { text: "我们可以学习别人，也可以从别人那里获得技术，但最终要发展自己的东西。\nWǒmen kěyǐ xuéxí biérén, yě kěyǐ cóng biérén nàlǐ huòdé jìshù, dàn zuìzhōng yào fāzhǎn zìjǐ de dōngxi.\nKita bisa belajar dari orang lain dan memperoleh teknologi dari mereka, tetapi pada akhirnya harus mengembangkan milik kita sendiri.", author: "任正非" },
                    { text: "商人必须与时俱进，知识与商业成功之间的联系比过去更加紧密。\nShāngrén bìxū yǔshí jùjìn, zhīshì yǔ shāngyè chénggōng zhījiān de liánxì bǐ guòqù gèngjiā jǐnmì.\nPengusaha harus mengikuti perkembangan zaman; hubungan antara pengetahuan dan keberhasilan bisnis semakin erat.", author: "李嘉诚" },
                    { text: "知识不能仅仅是一张文凭或一种技能。\nZhīshì bù néng jǐnjǐn shì yì zhāng wénpíng huò yì zhǒng jìnéng.\nPengetahuan tidak boleh hanya berupa ijazah atau sebuah keterampilan.", author: "李嘉诚" },
                    { text: "我们正在进入一个新的综合时代，需要更广阔的视野、批判性思维和逻辑推理。\nWǒmen zhèngzài jìnrù yí ge xīn de zōnghé shídài, xūyào gèng guǎngkuò de shìyě, pīpànxìng sīwéi hé luójí tuīlǐ.\nKita sedang memasuki era sintesis baru yang membutuhkan pandangan lebih luas, pemikiran kritis, dan penalaran logis.", author: "李嘉诚" },
                    { text: "成功取决于在机会出现时抓住机会，并运用已经积累的知识。\nChénggōng qǔjué yú zài jīhuì chūxiàn shí zhuāzhù jīhuì, bìng yùnyòng yǐjīng jīlěi de zhīshì.\nKeberhasilan bergantung pada kemampuan menangkap peluang ketika muncul dan menggunakan pengetahuan yang telah dikumpulkan.", author: "李嘉诚" },
                    { text: "创新就是不断重新组织已有的生产要素。\nChuàngxīn jiù shì bùduàn chóngxīn zǔzhī yǐyǒu de shēngchǎn yàosù.\nInovasi berarti terus menemukan cara baru untuk mengatur kembali sumber daya yang sudah ada.", author: "张瑞敏" },
                    { text: "企业应该像一个生态系统。\nQǐyè yīnggāi xiàng yí ge shēngtài xìtǒng.\nPerusahaan seharusnya bekerja seperti sebuah ekosistem.", author: "张瑞敏" },
                    { text: "互联网时代最重要的挑战之一就是速度。\nHùliánwǎng shídài zuì zhòngyào de tiǎozhàn zhī yī jiù shì sùdù.\nSalah satu tantangan terpenting di era Internet adalah kecepatan.", author: "张瑞敏" },
                    { text: "谁能更快地赢得用户，谁就更有可能赢得市场。\nShéi néng gèng kuài de yíngdé yònghù, shéi jiù gèng yǒu kěnéng yíngdé shìchǎng.\nSiapa yang lebih cepat memenangkan pengguna, dialah yang lebih berpeluang memenangkan pasar.", author: "张瑞敏" },
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
        }).catch(err => console.log('Share error:', err));
    } else {
        navigator.clipboard.writeText(url).then(() => {
            alert("Article link successfully copied to clipboard!");
        }).catch(err => {
            alert("Failed to copy link: " + url);
        });
    }
}
