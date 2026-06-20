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
  const explainer = explainCategory(item.category);
  return {
    category: item.category,
    source: item.source,
    title: item.title,
    url: item.url,
    summary,
    fullText: [
      summary,
      `In simple English, this report is about a ${item.category.toLowerCase()} issue connected to Korea. The headline gives you the main event, and the summary gives you the first details you need before reading more.`,
      explainer,
      `For English practice, pay attention to these useful words: ${words.join(", ")}. Try to notice how they are used in the headline and summary, because these words often appear in similar news stories.`,
      "After reading, write three short sentences in your own words. First, say what happened. Second, say who is involved. Third, say why the story may matter for people living in Korea."
    ],
    words,
    question: `Why does this ${item.category.toLowerCase()} story matter for people living in Korea?`
  };
}

function explainCategory(category) {
  const key = category.toLowerCase();
  if (key.includes("politics")) return "Political news is important because government decisions and party conflicts can affect laws, public services, and daily life. When you read this kind of story, look for who has power, who disagrees, and what decision may come next.";
  if (key.includes("economy")) return "Economic news can affect jobs, prices, savings, and business confidence. When you read this kind of story, look for numbers, market changes, and whether the news is good for ordinary people or mainly for companies.";
  if (key.includes("inter-korea") || key.includes("north")) return "Inter-Korean news is important because North Korea can affect security, diplomacy, and public feeling in South Korea. When you read this kind of story, look for whether the situation is becoming calmer or more tense.";
  if (key.includes("weather")) return "Weather news is practical because it can affect transport, schools, flights, outdoor plans, and safety. When you read this kind of story, look for the place, the time, and what people are advised to do.";
  if (key.includes("law")) return "Legal news often explains investigations, court decisions, or public accusations. When you read this kind of story, look for what the court decided, what law was involved, and whether the case may continue.";
  if (key.includes("technology")) return "Technology news is important because digital services, data, and online security affect everyday life. When you read this kind of story, look for what changed, who is affected, and what users should do next.";
  return "This news story helps you understand one current issue in Korea. When you read it, look for the main event, the people or organizations involved, and the possible effect on society.";
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
