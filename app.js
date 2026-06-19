const archive = window.NEWS_ARCHIVE || [];

const dateList = document.querySelector("#date-list");
const editionCount = document.querySelector("#edition-count");
const editionLabel = document.querySelector("#edition-label");
const editionTitle = document.querySelector("#edition-title");
const dailySummary = document.querySelector("#daily-summary");
const primarySource = document.querySelector("#primary-source");
const stories = document.querySelector("#stories");
const storyTotal = document.querySelector("#story-total");
const dictionaryForm = document.querySelector("#dictionary-form");
const dictionaryInput = document.querySelector("#dictionary-input");
const dictionaryLinks = document.querySelector("#dictionary-links");
const dictionaryResult = document.querySelector("#dictionary-result");
const dictionaryPopover = document.querySelector("#dictionary-popover");
const selectedWord = document.querySelector("#selected-word");
const popoverCambridge = document.querySelector("#popover-cambridge");
const popoverTranslate = document.querySelector("#popover-translate");

let selectedDate = archive[0]?.date;

const localDictionary = {
  "fact-finding panel": {
    zh: "調查小組；事實調查委員會",
    type: "noun phrase",
    example: "A fact-finding panel reviewed the election problem."
  },
  "ballot shortage": {
    zh: "選票不足",
    type: "noun phrase",
    example: "The ballot shortage caused concern among voters."
  },
  "election officials": {
    zh: "選舉官員",
    type: "noun phrase",
    example: "Election officials must prepare enough voting materials."
  },
  "market cap": {
    zh: "市值",
    type: "noun",
    example: "The company’s market cap increased this week."
  },
  "record high": {
    zh: "歷史新高",
    type: "noun phrase",
    example: "The stock index reached a record high."
  },
  "investor interest": {
    zh: "投資者興趣；投資意欲",
    type: "noun phrase",
    example: "Investor interest grew after the strong earnings report."
  },
  "joint statement": {
    zh: "聯合聲明",
    type: "noun phrase",
    example: "The leaders released a joint statement after the meeting."
  },
  "military cooperation": {
    zh: "軍事合作",
    type: "noun phrase",
    example: "The countries discussed military cooperation."
  },
  "denuclearization": {
    zh: "無核化",
    type: "noun",
    example: "Denuclearization is often discussed in Korean Peninsula news."
  },
  "confirm": {
    zh: "確認；批准任命",
    type: "verb",
    example: "The Senate confirmed the new ambassador."
  },
  "ambassador": {
    zh: "大使",
    type: "noun",
    example: "An ambassador represents one country in another country."
  },
  "alliance": {
    zh: "同盟；聯盟",
    type: "noun",
    example: "South Korea and the United States have a close alliance."
  },
  "forecast": {
    zh: "預報",
    type: "noun / verb",
    example: "The weather forecast says heavy rain is coming."
  },
  "southern regions": {
    zh: "南部地區",
    type: "noun phrase",
    example: "Heavy rain is expected in southern regions."
  },
  "weather changes": {
    zh: "天氣變化",
    type: "noun phrase",
    example: "Sudden weather changes can affect travel."
  },
  "data breach": {
    zh: "資料外洩；數據洩露",
    type: "noun phrase",
    example: "The company apologized for the data breach."
  },
  "personal information": {
    zh: "個人資料",
    type: "noun phrase",
    example: "Companies must protect personal information."
  },
  "streaming platform": {
    zh: "串流平台",
    type: "noun phrase",
    example: "Many people watch dramas on a streaming platform."
  },
  "inquiry": {
    zh: "調查；查詢",
    type: "noun",
    example: "Lawmakers opened an inquiry into the problem."
  },
  "breach": {
    zh: "違反；破壞；資料外洩",
    type: "noun / verb",
    example: "A security breach exposed user data."
  },
  "official": {
    zh: "官員；官方的",
    type: "noun / adjective",
    example: "An official explained the new policy."
  },
  "shortage": {
    zh: "短缺；不足",
    type: "noun",
    example: "A shortage of ballots delayed voting."
  },
  "investigation": {
    zh: "調查",
    type: "noun",
    example: "The investigation will continue next week."
  },
  "cooperation": {
    zh: "合作",
    type: "noun",
    example: "The two governments promised closer cooperation."
  },
  "privacy": {
    zh: "私隱；隱私",
    type: "noun",
    example: "Digital privacy is important for internet users."
  },
  "advisory": {
    zh: "警報；提示；公告",
    type: "noun",
    example: "The city issued a heat advisory."
  },
  "problem": {
    zh: "問題；難題",
    type: "noun",
    example: "The problem affected many voters."
  },
  "affect": {
    zh: "影響",
    type: "verb",
    example: "Heavy rain can affect transportation."
  },
  "prepare": {
    zh: "準備",
    type: "verb",
    example: "Officials must prepare voting materials carefully."
  },
  "manage": {
    zh: "管理；處理",
    type: "verb",
    example: "The team managed the situation quickly."
  },
  "voter": {
    zh: "選民",
    type: "noun",
    example: "Voters waited at the polling station."
  },
  "trust": {
    zh: "信任",
    type: "noun / verb",
    example: "Public trust is important in elections."
  },
  "company": {
    zh: "公司",
    type: "noun",
    example: "The company promised to protect user data."
  },
  "economy": {
    zh: "經濟",
    type: "noun",
    example: "The economy is closely watched by investors."
  },
  "security": {
    zh: "安全；保安",
    type: "noun",
    example: "Security is an important issue for both countries."
  },
  "policy": {
    zh: "政策",
    type: "noun",
    example: "The government announced a new policy."
  },
  "government": {
    zh: "政府",
    type: "noun",
    example: "The government responded to the report."
  },
  "region": {
    zh: "地區",
    type: "noun",
    example: "Rain is expected in the southern region."
  },
  "transportation": {
    zh: "交通；運輸",
    type: "noun",
    example: "Bad weather can affect transportation."
  },
  "expose": {
    zh: "暴露；揭露",
    type: "verb",
    example: "The data breach exposed private information."
  },
  "leak": {
    zh: "洩漏；外洩",
    type: "noun / verb",
    example: "The company investigated the data leak."
  }
};

const irregularForms = {
  people: "person",
  children: "child",
  men: "man",
  women: "woman",
  data: "data",
  was: "be",
  were: "be",
  has: "have",
  had: "have"
};

function renderDateList() {
  editionCount.textContent = `${archive.length} ${archive.length === 1 ? "edition" : "editions"}`;
  dateList.innerHTML = archive.map((edition) => {
    const active = edition.date === selectedDate ? " active" : "";
    return `
      <button class="date-button${active}" type="button" data-date="${edition.date}">
        <strong>${edition.label}</strong>
        <span>${edition.stories.length} stories saved</span>
      </button>
    `;
  }).join("");
}

function renderEdition() {
  const edition = archive.find((item) => item.date === selectedDate) || archive[0];
  if (!edition) return;

  editionLabel.textContent = edition.label;
  editionTitle.textContent = edition.title;
  dailySummary.textContent = edition.summary;
  primarySource.href = edition.primarySource;
  storyTotal.textContent = `${edition.stories.length} ${edition.stories.length === 1 ? "story" : "stories"}`;

  stories.innerHTML = edition.stories.map((story, index) => renderStory(story, index + 1)).join("");
}

function renderStory(story, index) {
  if (!story) return "";
  const paragraphs = story.fullText || [story.summary];
  return `
    <article class="news-article">
      <div class="story-top">
        <div class="story-labels">
          <span class="story-number">${String(index).padStart(2, "0")}</span>
          <span class="tag">${story.category}</span>
        </div>
        <span class="source">${story.source}</span>
      </div>
      <h3>${story.title}</h3>
      <p class="article-summary">${story.summary}</p>
      <div class="article-body">
        ${paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("")}
      </div>
      <div class="word-row" aria-label="Useful vocabulary">
        ${story.words.map((word) => `<span>${word}</span>`).join("")}
      </div>
      <div class="question">
        <strong>Think:</strong> ${story.question}
      </div>
      <a class="read-link" href="${story.url}" target="_blank" rel="noreferrer">Source link</a>
    </article>
  `;
}

dateList.addEventListener("click", (event) => {
  const button = event.target.closest(".date-button");
  if (!button) return;
  selectedDate = button.dataset.date;
  renderDateList();
  renderEdition();
});

renderDateList();
renderEdition();

function dictionaryUrls(term) {
  const word = encodeURIComponent(term.trim());
  return {
    cambridgeTraditional: `https://dictionary.cambridge.org/dictionary/english-chinese-traditional/${word}`,
    cambridgeSimplified: `https://dictionary.cambridge.org/dictionary/english-chinese-simplified/${word}`,
    googleTraditional: `https://translate.google.com/?sl=en&tl=zh-TW&text=${word}&op=translate`,
    googleSimplified: `https://translate.google.com/?sl=en&tl=zh-CN&text=${word}&op=translate`
  };
}

async function renderDictionaryLinks(term) {
  const cleanTerm = term.trim();
  if (!cleanTerm) return;
  const urls = dictionaryUrls(cleanTerm);
  const lookup = findDictionaryEntry(cleanTerm);
  const entry = lookup.entry;

  dictionaryResult.innerHTML = `
    <h3>${cleanTerm}</h3>
    <p class="dict-type">Searching inside this page...</p>
  `;
  dictionaryLinks.innerHTML = `
    <a href="${urls.cambridgeTraditional}" target="_blank" rel="noreferrer">Cambridge 繁中</a>
    <a href="${urls.cambridgeSimplified}" target="_blank" rel="noreferrer">Cambridge 简中</a>
    <a href="${urls.googleTraditional}" target="_blank" rel="noreferrer">Google 繁中</a>
    <a href="${urls.googleSimplified}" target="_blank" rel="noreferrer">Google 简中</a>
  `;

  try {
    const online = await lookupOnlineTranslation(cleanTerm);
    if (online?.translatedText) {
      dictionaryResult.innerHTML = `
        <h3>${cleanTerm}</h3>
        <p class="dict-type">Online translation</p>
        <p class="dict-meaning">${online.translatedText}</p>
        ${online.match ? `<p class="dict-example">Also: ${online.match}</p>` : ""}
      `;
      return;
    }
  } catch (error) {
    // If Chrome blocks the request, fall back to local words and backup links.
  }

  dictionaryResult.innerHTML = entry ? `
    <h3>${cleanTerm}</h3>
    ${lookup.normalized !== cleanTerm.toLowerCase() ? `<p class="dict-note">Base word: ${lookup.normalized}</p>` : ""}
    <p class="dict-type">${entry.type}</p>
    <p class="dict-meaning">${entry.zh}</p>
    <p class="dict-example">${entry.example}</p>
  ` : `
    <h3>${cleanTerm}</h3>
    <p class="dict-meaning">I could not translate this inside the page.</p>
    <p class="dict-example">Please check your internet connection, or use the backup links below.</p>
  `;
}

async function lookupOnlineTranslation(term) {
  const endpoint = new URL("https://api.mymemory.translated.net/get");
  endpoint.searchParams.set("q", term);
  endpoint.searchParams.set("langpair", "en|zh-TW");

  const response = await fetch(endpoint.toString());
  if (!response.ok) return null;

  const data = await response.json();
  const translatedText = data?.responseData?.translatedText;
  const match = data?.matches?.find((item) => item.translation && item.translation !== translatedText)?.translation;

  return { translatedText, match };
}

function findDictionaryEntry(term) {
  const normalized = term.toLowerCase().replace(/[.,!?;:()[\]"']/g, "").trim();
  const candidates = [
    normalized,
    irregularForms[normalized],
    normalized.endsWith("ies") ? `${normalized.slice(0, -3)}y` : "",
    normalized.endsWith("es") ? normalized.slice(0, -2) : "",
    normalized.endsWith("s") ? normalized.slice(0, -1) : "",
    normalized.endsWith("ing") ? normalized.slice(0, -3) : "",
    normalized.endsWith("ed") ? normalized.slice(0, -2) : ""
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (localDictionary[candidate]) {
      return { normalized: candidate, entry: localDictionary[candidate] };
    }
  }

  return { normalized, entry: null };
}

dictionaryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const term = dictionaryInput.value.trim();
  if (!term) return;
  renderDictionaryLinks(term);
});

document.addEventListener("mouseup", () => {
  const selection = window.getSelection();
  const term = selection.toString().trim().replace(/\s+/g, " ");
  if (!term || term.length > 40) {
    dictionaryPopover.hidden = true;
    return;
  }

  const range = selection.rangeCount ? selection.getRangeAt(0) : null;
  if (!range || !document.querySelector(".article-stream").contains(range.commonAncestorContainer)) {
    dictionaryPopover.hidden = true;
    return;
  }

  const box = range.getBoundingClientRect();
  const urls = dictionaryUrls(term);
  selectedWord.textContent = term;
  popoverCambridge.href = urls.cambridgeTraditional;
  popoverTranslate.href = urls.googleTraditional;
  dictionaryInput.value = term;
  renderDictionaryLinks(term);
  dictionaryPopover.style.left = `${Math.min(box.left + window.scrollX, window.scrollX + window.innerWidth - 190)}px`;
  dictionaryPopover.style.top = `${box.bottom + window.scrollY + 8}px`;
  dictionaryPopover.hidden = false;
});

document.addEventListener("mousedown", (event) => {
  if (!dictionaryPopover.contains(event.target)) {
    dictionaryPopover.hidden = true;
  }
});
