const lessons = [
  {
    title: "一、认宫位",
    text: "先把命、兄、夫、子、财、疾、迁、友、官、田、福、父十二宫当作人生议题地图。"
  },
  {
    title: "二、看主星",
    text: "紫微、天府、太阳、太阴等主星代表不同性格动力，先学含义，再看落宫。"
  },
  {
    title: "三、读四化",
    text: "禄、权、科、忌像能量流向，用来观察机会、责任、声誉与卡点。"
  },
  {
    title: "四、起一卦",
    text: "易经重在变化。先记录问题、处境、卦象，再复盘实际结果。"
  }
];

const palaces = ["命宫", "财帛宫", "官禄宫", "福德宫", "迁移宫", "夫妻宫", "田宅宫", "父母宫"];
const stars = ["紫微", "天机", "太阳", "武曲", "天同", "廉贞", "天府", "太阴", "贪狼", "巨门", "天相", "天梁", "七杀", "破军"];
const hexagrams = ["乾为天", "坤为地", "水雷屯", "山水蒙", "水天需", "天水讼", "地水师", "水地比", "风天小畜", "天泽履", "地天泰", "天地否"];
const courseSteps = [
  {
    title: "看一集",
    text: "先抓本集主题，不急着记住所有术语。"
  },
  {
    title: "记三点",
    text: "记录一个新概念、一个案例、一个仍不明白的问题。"
  },
  {
    title: "对照盘",
    text: "把视频内容放到自己的研习记录里做小范围验证。"
  },
  {
    title: "周复盘",
    text: "每周整理一次笔记，区分知识、体会和待查资料。"
  }
];

const lessonList = document.querySelector("#lessonList");
const courseNotes = document.querySelector("#courseNotes");
const form = document.querySelector("#readingForm");
const result = document.querySelector("#result");
const astrolabeForm = document.querySelector("#astrolabeForm");
const astrolabeResult = document.querySelector("#astrolabeResult");

lessonList.innerHTML = lessons.map((lesson) => `
  <article class="lesson">
    <strong>${lesson.title}</strong>
    <span>${lesson.text}</span>
  </article>
`).join("");

courseNotes.innerHTML = courseSteps.map((step, index) => `
  <article class="note-item">
    <span>${index + 1}</span>
    <div>
      <strong>${step.title}</strong>
      <p>${step.text}</p>
    </div>
  </article>
`).join("");

astrolabeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(astrolabeForm).entries());
  data.isLeapMonth = data.isLeapMonth === "on";

  astrolabeResult.innerHTML = "<p class=\"muted\">正在生成命盘...</p>";

  try {
    const response = await fetch("/api/astrolabe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data)
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.detail || payload.error || "生成失败");
    }
    astrolabeResult.innerHTML = renderAstrolabe(payload);
  } catch (error) {
    astrolabeResult.innerHTML = `<p class="muted">${escapeHtml(error.message)}</p>`;
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  const seed = hash(`${data.birthDate}-${data.birthHour}-${data.focus}-${data.name}`);
  const palace = pick(palaces, seed);
  const star = pick(stars, seed >> 2);
  const hexagram = pick(hexagrams, seed >> 4);
  const localReading = createLocalReading(data, palace, star, hexagram);

  result.innerHTML = renderLocal(data, palace, star, hexagram, localReading, "正在请求千问补充分析...");

  try {
    const response = await fetch("/api/qianwen", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        profile: data,
        question: data.question,
        localReading
      })
    });
    const payload = await response.json();
    result.innerHTML = renderLocal(data, palace, star, hexagram, localReading, payload.answer || "暂无 AI 补充。");
  } catch {
    result.innerHTML = renderLocal(data, palace, star, hexagram, localReading, "当前环境未连接千问，已保留本地研习记录。");
  }
});

function hash(value) {
  let total = 0;
  for (let index = 0; index < value.length; index += 1) {
    total = (total * 31 + value.charCodeAt(index)) >>> 0;
  }
  return total || 1;
}

function pick(list, seed) {
  return list[Math.abs(seed) % list.length];
}

function renderAstrolabe(payload) {
  const profile = payload.profile;
  return `
    <div class="astrolabe-summary">
      ${summaryItem("阳历", profile.solarDate)}
      ${summaryItem("农历", profile.lunarDate)}
      ${summaryItem("四柱", profile.chineseDate)}
      ${summaryItem("时辰", `${profile.time} ${profile.timeRange}`)}
      ${summaryItem("生肖 / 星座", `${profile.zodiac} / ${profile.sign}`)}
      ${summaryItem("五行局", profile.fiveElementsClass)}
      ${summaryItem("命宫", profile.soulPalaceBranch)}
      ${summaryItem("身宫", profile.bodyPalaceBranch)}
    </div>
    <div class="palace-grid">
      ${payload.palaces.map(renderPalace).join("")}
    </div>
  `;
}

function summaryItem(label, value) {
  return `
    <div class="summary-item">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value || "-")}</strong>
    </div>
  `;
}

function renderPalace(palace) {
  const majorStars = palace.majorStars.map((star) => renderStar(star, "major")).join("");
  const mutagens = palace.majorStars
    .concat(palace.minorStars)
    .filter((star) => star.mutagen)
    .map((star) => `<span class="tag mutagen">${escapeHtml(star.name)}化${escapeHtml(star.mutagen)}</span>`)
    .join("");
  const minorStars = palace.minorStars.slice(0, 4).map((star) => renderStar(star)).join("");
  const flags = [
    palace.isBodyPalace ? "身宫" : "",
    palace.isOriginalPalace ? "来因宫" : ""
  ].filter(Boolean).map((flag) => `<span class="tag mutagen">${flag}</span>`).join("");

  return `
    <article class="palace-card">
      <div class="palace-title">
        <strong>${escapeHtml(palace.name)}</strong>
        <span>${escapeHtml(palace.heavenlyStem)}${escapeHtml(palace.earthlyBranch)}</span>
      </div>
      <div class="palace-tags">${flags}${majorStars || "<span class=\"tag\">无主星</span>"}${mutagens}</div>
      <div class="palace-tags">${minorStars || "<span class=\"tag\">辅星略</span>"}</div>
      <div class="palace-meta">
        大限 ${escapeHtml(palace.decadal?.range?.join("-") || "-")} 岁 · ${escapeHtml(palace.changsheng12)} · ${escapeHtml(palace.boshi12)}
      </div>
    </article>
  `;
}

function renderStar(star, className = "") {
  const detail = [star.brightness, star.mutagen ? `化${star.mutagen}` : ""].filter(Boolean).join(" ");
  return `<span class="tag ${className}">${escapeHtml(star.name)}${detail ? ` ${escapeHtml(detail)}` : ""}</span>`;
}

function createLocalReading(data, palace, star, hexagram) {
  return [
    `${data.name || "此盘"}以「${palace}」作为今日观察入口，适合把${data.focus}放回长期节律里看。`,
    `主星线索为「${star}」，可先记录它对应的行为倾向，再和真实经历互证。`,
    `易经提示取「${hexagram}」，重点不是预言结果，而是观察当下处境如何变化。`
  ].join("\n");
}

function renderLocal(data, palace, star, hexagram, localReading, aiReading) {
  return `
    <h3>本地研习记录</h3>
    <p><strong>主题：</strong>${escapeHtml(data.focus)} · <strong>入口：</strong>${palace} · <strong>星曜：</strong>${star} · <strong>卦象：</strong>${hexagram}</p>
    ${localReading.split("\n").map((line) => `<p>${escapeHtml(line)}</p>`).join("")}
    <h3>千问补充</h3>
    ${String(aiReading).split("\n").filter(Boolean).map((line) => `<p>${escapeHtml(line)}</p>`).join("")}
  `;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
