/* ================================================================
   Builds the WordPress version of the Daf Yomi hub.
     node wordpress/build.js
   Outputs:
     wordpress/daf-hub-wordpress.html  paste into WordPress (Code editor)
     wp-preview.html                   the same markup on Vercel, for comparison
   Page text lives here as WordPress blocks; once it's in WordPress,
   editors change it there, not here.
   ================================================================ */
const fs = require('fs');
const path = require('path');

const IMG = 'https://daf-yomi-red.vercel.app/images/';
const img = file => IMG + encodeURIComponent(file);

/* ---------- block helpers (serialized Gutenberg markup) ---------- */
const attrs = (cls, extra = {}) => JSON.stringify({ ...extra, className: cls });
const P = (cls, html) =>
  `<!-- wp:paragraph ${attrs(cls)} -->\n<p class="${cls}">${html}</p>\n<!-- /wp:paragraph -->`;
const H = (level, cls, html) =>
  `<!-- wp:heading ${attrs(cls, level === 2 ? {} : { level })} -->\n` +
  `<h${level} class="wp-block-heading ${cls}">${html}</h${level}>\n<!-- /wp:heading -->`;
const G = (cls, ...inner) =>
  `<!-- wp:group ${attrs(cls)} -->\n<div class="wp-block-group ${cls}">${inner.join('\n\n')}</div>\n<!-- /wp:group -->`;
const IMAGE = (cls, src, alt) =>
  `<!-- wp:image ${attrs(cls)} -->\n<figure class="wp-block-image ${cls}"><img src="${src}" alt="${alt}"/></figure>\n<!-- /wp:image -->`;
const BUTTON = (cls, href, text) =>
  `<!-- wp:buttons -->\n<div class="wp-block-buttons"><!-- wp:button ${attrs(cls)} -->\n` +
  `<div class="wp-block-button ${cls}"><a class="wp-block-button__link wp-element-button" href="${href}">${text}</a></div>\n` +
  `<!-- /wp:button --></div>\n<!-- /wp:buttons -->`;
const HTML = html => `<!-- wp:html -->\n${html}\n<!-- /wp:html -->`;
const DIVIDER = () =>
  `<!-- wp:separator ${attrs('sec-divider')} -->\n<hr class="wp-block-separator has-alpha-channel-opacity sec-divider"/>\n<!-- /wp:separator -->`;
const DETAILS = (q, a, open) =>
  `<!-- wp:details${open ? ' {"showContent":true}' : ''} -->\n` +
  `<details class="wp-block-details"${open ? ' open' : ''}><summary>${q}</summary>` +
  `<!-- wp:paragraph -->\n<p>${a}</p>\n<!-- /wp:paragraph --></details>\n<!-- /wp:details -->`;
const link = (href, text, external) =>
  `<a href="${href}"${external ? ' target="_blank" rel="noreferrer noopener"' : ''}>${text}</a>`;

/* ---------- content ---------- */
const SUBSCRIBE = 'https://www.myjewishlearning.com/get-your-daily-dose-of-talmud/';
const WEEK_IN_REVIEW = 'https://docs.google.com/forms/d/e/1FAIpQLSeM09B8nrxRVTwZk7Do-VammeDzMNimev6MqXLDOInFhuc2eQ/viewform';
const BOOK_CLUB = 'https://www.myjewishlearning.com/off-the-daf-a-talmud-book-club/';

const hero = G('card hero',
  H(1, 'h-title hero-headline', 'Study Talmud Every Day<br>With My Jewish Learning'),
  P('hero-intro', 'Daf Yomi means “daily page.” Every day, Jews around the world study the same page of the Talmud — moving in sync through all 2,711 of its pages over about seven and a half years, then starting again. Daf Yomi has been called the world’s largest book club. More than 100,000 people are following along right now.'),
  HTML(`<div class="dy-today">
  <div class="eyebrow" data-dy="eyebrow">Today on Daf Yomi</div>
  <div class="daf-today" data-dy="title"></div>
  <p class="h-sub" data-dy="sub"></p>
  <div class="bar"><div class="bar-fill"></div></div>
  <div class="timeline-row"><span>Jan 5, 2020</span><span data-dy="pct"></span><span>Jun 7, 2027</span></div>
</div>`),
  BUTTON('dy-read-today', 'https://www.myjewishlearning.com/category/study/jewish-texts/talmud/', 'Read Today’s Dose')
);

const why = G('why',
  H(2, 'why-h', 'What Is the Talmud?'),
  P('why-body', 'The Talmud is a vast record of ancient rabbinic debates about Jewish law. Countless familiar Jewish prayers, holidays, and rituals are indelibly shaped by it.'),
  P('why-body', 'You don’t need Hebrew or Aramaic, or to have any background, to learn with us. Each day, every page is explained in plain English.'),
  BUTTON('dy-subscribe', SUBSCRIBE, 'Subscribe — it’s free')
);

const EVENTS = [
  ['Oct 29', 'Week in Review · Zoom', WEEK_IN_REVIEW, 'Weekly recap — Thursdays 9:30 AM ET'],
  ['Nov 12', 'Off the Daf · Book Club', BOOK_CLUB, 'Live author conversation — <em>The Garden and the Workshop</em>'],
  ['Nov 18', 'Siyyum · Completion Celebration', SUBSCRIBE, 'Tractate Bekhorot — join the global celebration']
];
const upcoming = G('upcoming',
  P('upcoming-eye', 'What’s coming up'),
  H(2, 'upcoming-title', 'Study opportunities'),
  ...EVENTS.map(([date, type, href, name]) => G('upcoming-event',
    P('upcoming-date', date),
    P('upcoming-type', type),
    P('upcoming-name', link(href, name))
  ))
);

const shelf = [
  P('eyebrow eyebrow-c', 'The 14th cycle · 37 volumes'),
  H(2, 'h-title h-center', 'The Talmud, on a shelf'),
  P('h-sub h-center', 'Select any volume of the Babylonian Talmud to read its archive of Daily Doses.'),
  HTML(`<div class="room">
  <div class="shelf-row"></div><div class="shelf-floor"></div>
  <div class="shelf-row"></div><div class="shelf-floor"></div>
  <div class="shelf-row"></div><div class="shelf-floor"></div>
  <div class="legend">
    <span><span class="legend-swatch done"></span>Read</span>
    <span><span class="legend-swatch cur"></span>Reading now</span>
    <span><span class="legend-swatch next"></span><span data-dy="next">Next</span></span>
    <span><span class="legend-swatch soon"></span>Upcoming</span>
  </div>
</div>`)
];

const MJL_AUTHOR = 'https://www.myjewishlearning.com/author/';
const MJL_UP = 'https://www.myjewishlearning.com/wp-content/uploads/';
/* [name, bio, photo URL or null for initials, link or null] */
const TEACHERS = [
  ['Dr. Rachel Scheinerman', 'My Jewish Learning editor, founded the Daily Dose project. PhD in rabbinic literature.', img('rachel scheinerman.avif'), MJL_AUTHOR + 'rscheinerman/'],
  ['Dr. Sara Ronis', 'Rabbi and educator. Writes on ritual, gender, and law.', MJL_UP + '2022/11/sara-ronis-sir-Mara-Lebovitz-400x400.jpeg', MJL_AUTHOR + 'sara-ronis/'],
  ['Rabbi Elliot Goldberg', 'Executive coach and consultant.', MJL_UP + '2021/05/Rabbi-Elliot-Goldberg-400x400.png', MJL_AUTHOR + 'rabbi-elliot-goldberg/'],
  ['Sue Parker Gerson', 'ADL Program Director. Co-author of <em>Teaching Jewish History</em>.', null, MJL_AUTHOR + 'sue-parker-gerson/'],
  ['Rabbi Lexie Botzum', 'Teaches at Yashrut’s Gemara program.', MJL_UP + '2024/02/headshot-with-sefer-400x400.jpg', MJL_AUTHOR + 'rabbi-lexie-botzum/'],
  ['Rabbi Seth Goren', 'Hillel Ontario’s senior vice president of learning, education and research.', null, MJL_AUTHOR + 'rabbi-seth-goren/'],
  ['Rabbi Ephraim Pelcovits', 'Educator, consultant and mentor.', MJL_UP + '2020/04/unnamed-400x400.jpg', MJL_AUTHOR + 'rabbi-ephraim-pelcovitz/'],
  ['Max Buchdahl', 'Rabbinical student with a master’s degree in Talmud and rabbinics.', MJL_UP + '2024/02/Image-from-iOS-400x400.jpg', MJL_AUTHOR + 'max-buchdahl/'],
  ['Rabbi Asher Lopatin', 'Spiritual leader at Kehillat Etz Chaim in Detroit.', MJL_UP + '2015/04/lopatin_asher.jpg', MJL_AUTHOR + 'rabbi-asher-lopatin/'],
  ['Rabbanit Dasi Fruchter', 'Founder and spiritual leader of the South Philadelphia Shtiebel.', MJL_UP + '2019/08/dasiheadshot-1.jpg', MJL_AUTHOR + 'rabbanit-dasi-fruchter/'],
  ['Rabbi Ari Saks', 'Spiritual leader and co-host of the Interfaithing Podcast.', null, null],
  ['Dr. Yardaena Osband', 'Pediatrician and lecturer.', null, MJL_AUTHOR + 'yardaena-osband/'],
  ['Rabbi Avigayil Halpern', 'Writer and educator.', MJL_UP + '2015/04/purple-blazer-action-shot-1-400x400.jpg', MJL_AUTHOR + 'avigayil-halpern/'],
  ['Rabbi Shira Botzum', 'Jewish educator.', null, MJL_AUTHOR + 'rabbi-shira-botzum/'],
  ['Rabba Alieza Salzberg Yizhar', 'Jewish educator.', MJL_UP + '2015/02-1/Alieza-Salzberg-headshot-200x200.jpg', MJL_AUTHOR + 'alieza-salzberg/'],
  ['Rabbi Dan Ornstein', 'Writer and rabbi of Congregation Ohav Shalom in Albany.', null, MJL_AUTHOR + 'rabbi-dan-ornstein/'],
  ['Rabbi Jonah Rank', 'President of the Hebrew Seminary: A Rabbinical School for the Deaf and Hearing.', null, MJL_AUTHOR + 'jonah-rank/'],
  ['Rabbi Raysh Weiss', 'Co-senior rabbi of Temple Israel of Natick in Massachusetts.', null, MJL_AUTHOR + 'raysh-weiss/']
];
const TITLES = /^(Dr\.|Rabbi|Rabbanit|Rabba)\s+/;
const initials = name => name.replace(TITLES, '').split(/\s+/).filter(Boolean)
  .filter((w, i, a) => i === 0 || i === a.length - 1).map(w => w[0]).join('');
const teachers = [
  P('section-h', 'The voices behind the project'),
  H(2, 'section-title', 'Meet your teachers'),
  P('section-sub', 'These rabbis, scholars, and writers are among those who craft Daily Dose essays and teach Talmud on My Jewish Learning.'),
  G('scroll-row teacher-rows', ...TEACHERS.map(([name, bio, photo, url]) => G('person',
    photo ? IMAGE('avatar', photo, name) : P('avatar avatar-initials', initials(name)),
    P('person-name', url ? link(url, name, true) : name),
    P('person-bio', bio)
  )))
];

const SAGES = [
  {
    name: 'Rashi', era: '1040–1105 · France', daf: 'Berakhot 2a', image: 'brakhot_2a.jpg',
    bio: 'The most influential Talmud commentator. His commentary appears on every page.',
    period: 'Rishon · 11th–12th century', basedIn: 'Troyes, France',
    knownFor: 'Line-by-line commentary that made the Talmud accessible to all — printed on every page ever since',
    debatesWith: 'The Tosafists — his own grandsons and students, who challenge him in the outer column',
    teaching: 'Rashi never assumed his reader already knew. He explained everything, from the simplest word to the most tangled legal argument. That radical clarity is his legacy.',
    onThePage: 'The narrow inner column on every page is always Rashi. The distinctive slanted typeface — “Rashi script” — was named for him. Once you recognize it, you’ll never miss him.'
  },
  {
    name: 'Rabbi Akiva', era: 'c. 50–135 CE', daf: 'Berakhot 61b', image: 'brakhot_61b.jpg',
    bio: 'Shepherd turned sage. Foundational figure of rabbinic Judaism.',
    period: 'Tanna · 3rd generation', basedIn: 'Bnei Brak, Israel',
    knownFor: 'Deriving new laws from every letter and ornament of the Torah; martyrdom under Rome',
    debatesWith: 'Rabbi Ishmael, who argued Akiva read too much into the text',
    teaching: '“Love your neighbor as yourself — this is the great principle of the entire Torah.” (Yerushalmi Nedarim 9:4)',
    onThePage: 'Scholars say the anonymous Mishnah — the passages with no named author — follows Rabbi Akiva’s view. When the Mishnah speaks without attribution, it’s likely his voice.'
  },
  {
    name: 'Hillel', era: 'c. 110 BCE–10 CE', daf: 'Shabbat 31a', image: 'chabbath_31a.jpg',
    bio: 'Famous for the Golden Rule. School of Hillel shaped halakhah.',
    period: 'Tanna · Zugot (paired) era', basedIn: 'Jerusalem',
    knownFor: 'Legal leniency and ethical clarity; founding the School of Hillel that shaped mainstream Jewish law',
    debatesWith: 'Shammai — the two are paired on nearly every disputed question in the Mishnah',
    teaching: '“What is hateful to you, do not do to your neighbor. That is the whole Torah — the rest is commentary. Go and learn.” (Shabbat 31a)',
    onThePage: '“Beit Hillel says… Beit Shammai says…” appears hundreds of times in the Talmud. The law almost always follows Hillel. When it follows Shammai, it’s worth pausing to ask why.'
  },
  {
    name: 'Rava', era: 'c. 280–352 · Babylon', daf: 'Bava Metzia 59b', image: 'baba-metsia_59b.jpg',
    bio: 'Towering Babylonian sage. His debates with Abaye fill the Talmud.',
    period: 'Amora · 4th generation (Babylonian)', basedIn: 'Machoza, Babylon',
    knownFor: 'Civil and criminal law; his running debate with Abaye is the defining intellectual rivalry of the Talmud',
    debatesWith: 'Abaye — the law follows Rava in all but six of their disputes. The six exceptions are memorized by a special mnemonic.',
    teaching: '“A person should always live in the same city as their teacher.” He modeled this himself, remaining in Machoza to study under Rav Yosef. (Berakhot 8a)',
    onThePage: '“Rava said” often signals the resolution of a debate. When you see “Abaye said… Rava said…” side by side, expect Rava’s view to win — and to become law.'
  },
  {
    name: 'Rabbi Yochanan', era: 'c. 180–279', daf: 'Bava Metzia 84a', image: 'baba-metsia_84a.jpg',
    bio: 'Compiler of the Jerusalem Talmud, known for piercing legal mind.',
    period: 'Amora · 1st generation (Israeli)', basedIn: 'Tiberias, Israel',
    knownFor: 'The dominant voice of Israeli scholarship; principal architect of the Jerusalem Talmud',
    debatesWith: 'Reish Lakish — his brother-in-law and the Talmud’s most beloved intellectual friendship',
    teaching: '“Whoever recites a teaching in the name of the one who said it brings redemption to the world.” (Megillah 15a)',
    onThePage: 'When Babylonian and Israeli sages disagree, Yochanan speaks for Israel. His opinions often begin “Rabbi Yochanan said in the name of…” — he was meticulous about attribution.'
  },
  {
    name: 'Beruriah', era: '2nd century', daf: 'Berakhot 10a', image: 'brakhot_10a.jpg',
    bio: 'One of the only women whose teachings appear in the Talmud.',
    period: 'Tanna · 2nd century', basedIn: 'Israel (wife of Rabbi Meir)',
    knownFor: 'The only woman whose legal rulings are recorded in the Talmud and accepted as authoritative',
    debatesWith: 'Male sages she corrected on points of law — and her own husband, Rabbi Meir',
    teaching: 'When her two sons died, she asked Rabbi Meir: “If someone entrusts you with a treasure, must you return it when asked?” He said yes. “God gave us these sons and has taken them back.” (Midrash Mishlei 31)',
    onThePage: 'Her appearances are rare and always deliberate — each one was preserved in a literature that rarely recorded women’s voices. When she appears, it’s worth stopping.'
  }
];
const sageDetail = (key, label, text) => P('sd-' + key, `<strong>${label}:</strong> ${text}`);
const sages = [
  P('section-h spaced', 'From inside the text'),
  H(2, 'section-title', 'Meet the sages'),
  P('section-sub', 'The rabbis you’ll encounter on every page — tap one for a quick primer on who they are and why they matter.'),
  G('scroll-row', ...SAGES.map(s => G('person sage',
    IMAGE('avatar', img(s.image), `Vilna Shas, ${s.daf}`),
    P('person-name', s.name),
    P('person-meta', s.era),
    P('person-daf', `Daf: ${s.daf}`),
    P('person-bio', s.bio),
    G('sage-details',
      sageDetail('period', 'Period', s.period),
      sageDetail('basedin', 'Based in', s.basedIn),
      sageDetail('knownfor', 'Known for', s.knownFor),
      sageDetail('debates', 'Debates with', s.debatesWith),
      sageDetail('teaching', 'A teaching', s.teaching),
      sageDetail('onpage', 'On the page', s.onThePage)
    )
  )))
];

const REFS = [
  ['https://www.myjewishlearning.com/article/talmud-101/', 'What is the Talmud?', 'Mishnah, Gemara, and the 1,500-year conversation that shaped Jewish life.'],
  ['https://www.myjewishlearning.com/article/the-mishnah/', 'The building blocks of the Talmud', 'Every page has two layers — the Mishnah and the Gemara. Here’s what each one contributes.'],
  ['https://www.myjewishlearning.com/article/the-jerusalem-talmud/', 'Which Talmud is Daf Yomi?', 'There are actually two Talmuds. Daf Yomi follows the Babylonian — here’s why.'],
  ['https://www.myjewishlearning.com/article/talmud-words-and-phrases/', 'Glossary of terms', 'Halakhah, aggadah, sugya, machloket — words that come up over and over.'],
  ['https://www.myjewishlearning.com/article/the-six-orders-of-the-mishnah/', 'The six orders', 'How the Talmud organizes itself — Zera’im, Mo’ed, Nashim, Nezikin, Kodashim, Tahorot.'],
  ['https://www.myjewishlearning.com/article/9-things-to-know-about-the-daf-yomi-daily-page-of-talmud/', '9 things to know about Daf Yomi', 'A quick-read overview of the practice, its history, and how to make sense of what you’re reading each day.']
];
const refs = [
  P('section-h', 'Reference library'),
  H(2, 'section-title', 'Talmud, in plain English'),
  P('section-sub', 'If a term in today’s Daily Dose stops you, start here.'),
  G('ref-grid', ...REFS.map(([href, title, desc]) => G('ref',
    P('ref-title', link(href, title)),
    P('ref-desc', desc)
  )))
];

const WAYS = [
  ['way feat', 'א', 'Daily · email', 'A Daily Dose of Talmud', SUBSCRIBE, 'Five-minute insight on the day’s page, delivered to your inbox every morning. The heart of the project.'],
  ['way', 'ש', 'Weekly · Thursdays 9:30 AM ET', 'The Week in Review', WEEK_IN_REVIEW, 'Live Zoom recap of the week’s pages, hosted by a familiar Daily Dose writer or educator.'],
  ['way', 'ס', 'Monthly · book club', 'Off the Daf', BOOK_CLUB, 'Fiction and nonfiction inspired by the Talmud, featuring live conversations with authors.'],
  ['way', 'ר', 'Anytime · video', 'Class archive', 'https://www.youtube.com/playlist?list=PLTa0cbjtQOrc', 'Past Highlights sessions on YouTube — go back and rewatch anything you missed.'],
  ['way way-full', 'ק', 'Daily · community', 'Daf Yomi Facebook group', 'https://www.facebook.com/groups/dailydoseoftalmud', 'Thousands of readers asking questions, sharing reactions, and discussing each day’s page in real time.']
];
const ways = [
  P('section-h', 'Five free ways to engage'),
  H(2, 'section-title', 'Study with us'),
  P('section-sub', 'Choose how you like to learn Talmud.'),
  G('ways-grid', ...WAYS.map(([cls, letter, eye, title, href, desc]) => G(cls,
    P('way-ico', letter),
    P('way-eye', eye),
    H(3, 'way-title', link(href, title)),
    P('way-desc', desc)
  )))
];

const FAQS = [
  ['Do I need to know Hebrew or Aramaic?', 'Not at all. The Daily Dose is written in English. Hebrew and Aramaic terms are explained in context. Many of our most loyal readers have no formal Jewish education or language background.'],
  ['What if I miss a day or fall behind?', 'Don’t worry about it. Most Daf Yomi readers miss days. The schedule waits for no one, but the archive is always here, and the next email always lands tomorrow. Consistency over perfection.'],
  ['How long does each day take?', 'The Daily Dose is a five-minute read. Studying the actual page in depth typically takes 45–60 minutes, but that’s optional; the email alone is meaningful.'],
  ['When does the current cycle end?', 'The 14th cycle began January 5, 2020, and ends around June 7, 2027, with a global Siyyum HaShas celebration. The 15th cycle begins immediately after.']
];
const faq = [
  P('section-h', 'Frequently asked'),
  G('faq', ...FAQS.map(([q, a], i) => DETAILS(q, a, i === 0)))
];

/* ---------- assemble ---------- */
/* Held back at launch (Nov 2026) until Rachel reviews them; flip to true to bring back. */
const SHOW_SAGES = false;
const SHOW_REFS = false;
const css = fs.readFileSync(path.join(__dirname, 'hub.css'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, 'hub.js'), 'utf8');

const content = G('dy-hub',
  HTML(`<style>\n${css}</style>`),
  hero, why, upcoming,
  DIVIDER(), ...shelf,
  DIVIDER(), ...teachers, ...(SHOW_SAGES ? sages : []),
  ...(SHOW_REFS ? [DIVIDER(), ...refs] : []),
  DIVIDER(), ...ways,
  DIVIDER(), ...faq,
  HTML(`<script>\n${js}</script>`)
);

fs.writeFileSync(path.join(__dirname, 'daf-hub-wordpress.html'), content + '\n');

const preview = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Daf Yomi · WordPress preview</title>
<meta name="robots" content="noindex">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource-variable/lora@5.0.0/index.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/montserrat@5.0.0/600.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/montserrat@5.0.0/700.css">
<link rel="icon" type="image/png" href="images/mjl-favicon.png">
<style>
  body { margin: 0; background: #FAFAF7; }
  .wp-shell-header { background: #1D2936; color: #fff; padding: 16px 20px; font: italic 600 22px 'Lora Variable', Georgia, serif; }
  .wp-shell-header span { display: block; max-width: 900px; margin: 0 auto; }
  .wp-shell-note { max-width: 900px; margin: 0 auto; padding: 10px 20px; font: 12px/1.4 'Montserrat', sans-serif; color: rgba(29,41,54,0.6); }
  .wp-shell-main { padding: 12px 20px 48px; }
  @media (max-width: 600px) { .wp-shell-main { padding: 8px 16px 32px; } }
</style>
</head>
<body>
<header class="wp-shell-header"><span>My Jewish Learning</span></header>
<p class="wp-shell-note">Preview of the WordPress version: the exact block markup that gets pasted into WordPress.</p>
<main class="wp-shell-main">
${content}
</main>
</body>
</html>
`;
fs.writeFileSync(path.join(__dirname, '..', 'wp-preview.html'), preview);
console.log('Built wordpress/daf-hub-wordpress.html and wp-preview.html');
