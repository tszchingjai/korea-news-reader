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
    const pubDate = decode(cleanXml(readTag(item, "pubDate")));
    const timestamp = Number.isFinite(Date.parse(pubDate)) ? Date.parse(pubDate) : 0;

    return {
      title: title.trim(),
      url: url.trim(),
      description: description.trim(),
      category: category.trim() || "Korea",
      source: feed.includes("kbs.co.kr") ? "KBS World" : "The Korea Times",
      timestamp
    };
  });
}

function readTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match?.[1] || "";
}

function cleanXml(value) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decode(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function buildStory(item) {
  const summary = makeSummary(item);
  const words = pickWords(`${item.title} ${summary}`);

  return {
    category: item.category,
    source: item.source,
    title: item.title,
    url: item.url,
    summary,
    fullText: [
      summary,
      `This story is important because it shows what people in Korea are talking about today. Read the original headline carefully and notice the people, place, and issue involved.`,
      `For English practice, focus on the key nouns and verbs in this story. Try to explain the story in three simple sentences: what happened, who is involved, and why it matters.`
    ],
    words,
    question: `Why do you think this ${item.category.toLowerCase()} story matters for people living in Korea?`
  };
}

function makeSummary(item) {
  if (item.description && item.description.length > 40) {
    return trimSentence(item.description, 340);
  }

  return `This story reports on ${item.title.toLowerCase()}. Open the source link if you want the full original report.`;
}

function trimSentence(text, maxLength) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  const sliced = clean.slice(0, maxLength);
  const end = Math.max(sliced.lastIndexOf("."), sliced.lastIndexOf("?"), sliced.lastIndexOf("!"));
  return `${sliced.slice(0, end > 80 ? end + 1 : maxLength).trim()}...`;
}

function pickWords(text) {
  const stop = new Set([
    "about", "after", "again", "also", "amid", "been", "being", "from", "have", "into", "korea",
    "korean", "north", "south", "that", "their", "there", "this", "with", "will", "said", "says"
  ]);

  const candidates = text
    .toLowerCase()
    .replace(/[^a-z\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 6 && !stop.has(word));

  const picked = [];
  for (const word of candidates) {
    if (!picked.includes(word)) picked.push(word);
    if (picked.length === 3) break;
  }

  while (picked.length < 3) picked.push(["headline", "source", "summary"][picked.length]);
  return picked;
}

function guessCategory(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  if (text.includes("stock") || text.includes("market") || text.includes("economy")) return "Economy";
  if (text.includes("north korea") || text.includes("n. korea")) return "Inter-Korea";
  if (text.includes("president") || text.includes("party") || text.includes("lawmaker")) return "Politics";
  if (text.includes("rain") || text.includes("weather") || text.includes("heat")) return "Weather";
  if (text.includes("data") || text.includes("technology") || text.includes("ai")) return "Technology";
  if (text.includes("court") || text.includes("police") || text.includes("prosecution")) return "Law";
  return "Korea";
}

function buildDailySummary(stories) {
  const categories = [...new Set(stories.map((story) => story.category))].slice(0, 5);
  return `Today’s Korea news covers ${categories.join(", ")}. This free automatic edition uses public news feeds, so it gives you source-based summaries, vocabulary, and reading practice without paid AI credits.`;
}
