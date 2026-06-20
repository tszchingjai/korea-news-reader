import fs from "node:fs";
import vm from "node:vm";

const NEWS_FILE = "news-data.js";
const FEEDS = [
  "https://world.kbs.co.kr/rss/rss_news.htm?lang=e",
  "https://world.kbs.co.kr/rss/rss_news.htm?lang=e&id=Po",
  "https://world.kbs.co.kr/rss/rss_news.htm?lang=e&id=IK",
  "https://www.koreatimes.co.kr/www/rss/rss.xml"
];

const now = new Date();
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
const label = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Seoul", weekday: "long", year: "numeric", month: "long", day: "numeric" }).format(now);
const archive = readArchive();

if (archive.some((edition) => edition.date === today)) {
  console.log(`Edition ${today} already exists. Skipping.`);
  process.exit(0);
}

const stories = (await collectItems()).slice(0, 7).map(buildStory);
if (stories.length < 5) throw new Error(`Only found ${stories.length} stories. Need at least 5.`);

archive.unshift({
  date: today,
  label,
  title: "Korea News Brief",
  primarySource: "https://world.kbs.co.kr/service/news_main.htm?lang=e",
  summary: `Today’s Korea news covers ${[...new Set(stories.map((story) => story.category))].slice(0, 5).join(", ")}. This free edition uses public news feeds, so it updates without paid API credits.`,
  stories
});

writeArchive(archive);
console.log(`Added ${today} edition with ${stories.length} stories.`);

function readArchive() {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(NEWS_FILE, "utf8"), context, { filename: NEWS_FILE });
  return context.window.NEWS_ARCHIVE || [];
}

function writeArchive(items) {
  fs.writeFileSync(NEWS_FILE, `window.NEWS_ARCHIVE = ${JSON.stringify(items, null, 2)};\n`);
}

async function collectItems() {
  const items = [];
  for (const feed of FEEDS) {
    const response = await fetch(feed, { headers: { "User-Agent": "KoreaNewsReader/1.0" } });
    if (!response.ok) continue;
    const xml = await response.text();
    const source = feed.includes("kbs.co.kr") ? "KBS World" : "The Korea Times";
    for (const match of xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)) items.push(parseItem(match[0], source));
  }
  const seen = new Set();
  return items.filter((item) => item.title && item.url).filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  }).sort((a, b) => b.timestamp - a.timestamp);
}

function parseItem(xml, source) {
  const title = clean(readTag(xml, "title"));
  const url = clean(readTag(xml, "link")).replace(/^http:/, "https:");
  const description = clean(readTag(xml, "description"));
  const category = clean(readTag(xml, "category")) || guessCategory(`${title} ${description}`);
  const timestamp = Date.parse(clean(readTag(xml, "pubDate"))) || 0;
  return { title, url, description, category, source, timestamp };
}

function readTag(xml, tag) {
  return xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"))?.[1] || "";
}

function clean(text) {
  return text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#039;|&#39;/g, "'").replace(/&quot;/g, "\"").replace(/\s+/g, " ").trim();
}

function buildStory(item) {
  const summary = item.description.length > 40 ? trim(item.description, 340) : `This story reports on ${item.title.toLowerCase()}.`;
  const words = pickWords(`${item.title} ${summary}`);
  return {
    category: item.category,
    source: item.source,
    title: item.title,
    url: item.url,
    summary,
    fullText: [
      summary,
      "This story is useful for understanding what people in Korea are talking about today.",
      "For English practice, explain the story in three simple sentences: what happened, who is involved, and why it matters."
    ],
    words,
    question: `Why does this ${item.category.toLowerCase()} story matter for people living in Korea?`
  };
}

function trim(text, max) {
  return text.length <= max ? text : `${text.slice(0, max).trim()}...`;
}

function pickWords(text) {
  const stop = new Set(["about", "after", "again", "being", "from", "have", "korea", "korean", "north", "south", "their", "there", "this", "with", "said", "says"]);
  const words = text.toLowerCase().replace(/[^a-z\s-]/g, " ").split(/\s+/).filter((word) => word.length >= 6 && !stop.has(word));
  return [...new Set(words)].slice(0, 3).concat(["headline", "source", "summary"]).slice(0, 3);
}

function guessCategory(text) {
  const lower = text.toLowerCase();
  if (lower.includes("stock") || lower.includes("market") || lower.includes("economy")) return "Economy";
  if (lower.includes("north korea") || lower.includes("n. korea")) return "Inter-Korea";
  if (lower.includes("president") || lower.includes("party") || lower.includes("lawmaker")) return "Politics";
  if (lower.includes("rain") || lower.includes("weather") || lower.includes("heat")) return "Weather";
  if (lower.includes("court") || lower.includes("police") || lower.includes("prosecution")) return "Law";
  return "Korea";
}
