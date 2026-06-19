import fs from "node:fs";
import vm from "node:vm";

const NEWS_FILE = "news-data.js";
const MODEL = process.env.OPENAI_MODEL || "gpt-5.4-mini";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY. Add it as a GitHub repository secret.");
}

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

const edition = await generateEdition();
validateEdition(edition);

archive.unshift(edition);
writeArchive(archive);
console.log(`Added ${today} edition with ${edition.stories.length} stories.`);

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

async function generateEdition() {
  const prompt = `
Today is ${today} in Korea (${label}).

Create one daily Korea English news learner edition for a Chinese-speaking reader living in Korea.

Use current, reliable English-language Korea news sources such as:
- KBS World English
- Yonhap News Agency English
- Korea JoongAng Daily
- The Korea Times
- The Korea Herald
- Arirang News

Requirements:
- Choose 5 to 7 main Korea-related stories from today or the last 24 hours.
- Prioritize politics, economy, society, diplomacy, North Korea, weather, technology/data, and major culture/sports only when nationally important.
- Do not copy full article text or long excerpts.
- Write original learner-friendly English.
- Every story must include a real source URL.
- fullText must be 3 to 5 paragraphs, each paragraph 1 to 3 sentences.
- Include useful vocabulary for Chinese-speaking English learners.
- Use Traditional Chinese in dictionary.zh.
- Keep titles factual and simple.

Return only JSON matching the schema.
`;

  const body = {
    model: MODEL,
    input: prompt,
    tools: [{ type: "web_search_preview" }],
    text: {
      format: {
        type: "json_schema",
        name: "korea_news_learner_edition",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["date", "label", "title", "primarySource", "summary", "stories"],
          properties: {
            date: { type: "string" },
            label: { type: "string" },
            title: { type: "string" },
            primarySource: { type: "string" },
            summary: { type: "string" },
            stories: {
              type: "array",
              minItems: 5,
              maxItems: 7,
              items: {
                type: "object",
                additionalProperties: false,
                required: ["category", "source", "title", "url", "summary", "fullText", "words", "question", "dictionary"],
                properties: {
                  category: { type: "string" },
                  source: { type: "string" },
                  title: { type: "string" },
                  url: { type: "string" },
                  summary: { type: "string" },
                  fullText: {
                    type: "array",
                    minItems: 3,
                    maxItems: 5,
                    items: { type: "string" }
                  },
                  words: {
                    type: "array",
                    minItems: 3,
                    maxItems: 3,
                    items: { type: "string" }
                  },
                  question: { type: "string" },
                  dictionary: {
                    type: "array",
                    minItems: 3,
                    maxItems: 8,
                    items: {
                      type: "object",
                      additionalProperties: false,
                      required: ["word", "zh", "type", "example"],
                      properties: {
                        word: { type: "string" },
                        zh: { type: "string" },
                        type: { type: "string" },
                        example: { type: "string" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const text = extractOutputText(data);

  if (!text) {
    throw new Error("OpenAI response did not include text output.");
  }

  const edition = JSON.parse(text);
  edition.date = today;
  edition.label = label;
  return edition;
}

function extractOutputText(data) {
  if (data.output_text) return data.output_text;

  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) {
        return content.text;
      }
    }
  }

  return "";
}

function validateEdition(edition) {
  if (edition.date !== today) {
    throw new Error(`Generated date ${edition.date} did not match ${today}.`);
  }

  if (!Array.isArray(edition.stories) || edition.stories.length < 5) {
    throw new Error("Generated edition needs at least 5 stories.");
  }

  for (const story of edition.stories) {
    if (!story.url?.startsWith("http")) {
      throw new Error(`Story URL is invalid: ${story.title}`);
    }

    if (!Array.isArray(story.fullText) || story.fullText.length < 3) {
      throw new Error(`Story fullText is too short: ${story.title}`);
    }
  }
}
