import fs from "node:fs";
import vm from "node:vm";

const NEWS_FILE = "news-data.js";
const FEEDS = [
  "https://world.kbs.co.kr/rss/rss_news.htm?lang=e",
  "https://world.kbs.co.kr/rss/rss_news.htm?lang=e&id=Po",
  "https://world.kbs.co.kr/rss/rss_news.htm?lang=e&id=IK",
  "https://www.koreatimes.co.kr/www/rss/rss.xml"
];

const today = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
}).format(new Date());

const label = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Seoul",
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric"
}).format(new Date());

const archive = readArchive();

if (archive.some((edition) => edition.date === today)) {
  console.log(`Edition ${today} already exists. Skipping.`);
  process.exit(0);
}

const stories = await collectStories();

if (stories.length < 5) {
  throw new Error(`Only found ${stories.length} stories. Need at least 5.`);
}

const edition = {
  date: today,
  label,
  title: "Korea News Brief",
  primarySource: "https://world.kbs.co.kr/service/news_main.htm?lang=e",
  summary: buildDailySummary(stories),
  stories
};

archive.unshift(edition);
writeArchive(archive);
console.log(`Added ${today} edition with ${stories.length} stories.`);

function readArchive() {
  const source = fs.readFileSync(NEWS_FILE, "utf8");
  const context = { window: {} };
  vm.runInNewContext(source, context, { filename: NEWS_FILE });
  return context.window.NEWS_ARCHIVE || [];
}

function writeArchive(items) {
  const source = `window.NEWS_ARCHIVE = ${JSON.stringify(items, null, 2)};\n`;
  fs.writeFileSync(NEWS_FILE, source);
}

async function collectStories() {
  const allItems = [];

  for (const feed of FEEDS) {
    try {
      const response = await fetch(feed, { headers: { "User-Agent": "KoreaNewsReader/1.0" } });
      if (!response.ok) continue;
      const xml = await response.text();
      allItems.push(...parseRss(xml, feed));
    } catch (error) {
      console.warn(`Could not fetch ${feed}: ${error.message}`);
    }
  }

  const seen = new Set();
  const unique = allItems
    .filter((item) => item.title && item.url)
    .filter((item) => {
      const key = item.url.replace(/^http:/, "https:");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.timestamp - a.timestamp);

  return unique.slice(0, 7).map((item) => buildStory(item));
}

function parseRss(xml, feed) {
  const items = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((match) => match[0]);

  return items.map((item) => {
    const title = decode(cleanXml(readTag(item, "title")));
    const url = decode(cleanXml(readTag(item, "link")));
    const description = decode(cleanXml(readTag(item, "description")));
    const category = decode(cleanXml(readTag(item, "category"))) || guessCategory(title, description);
