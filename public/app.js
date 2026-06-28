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
  const palaceByIndex = new Map(payload.palaces.map((palace) => [palace.index, palace]));
  const chartSlots = [
    [3, "slot-1"],
    [4, "slot-2"],
    [5, "slot-3"],
    [6, "slot-4"],
    [2, "slot-5"],
    [7, "slot-8"],
    [1, "slot-9"],
    [8, "slot-12"],
    [0, "slot-13"],
    [11, "slot-14"],
    [10, "slot-15"],
    [9, "slot-16"]
  ];

  return `
    <div class="chart-context">
      <div>
        <strong>当前命盘</strong>
        <span>${escapeHtml(profile.solarDate)} · ${escapeHtml(profile.time.replace("时", ""))} · ${escapeHtml(profile.gender)} · ${escapeHtml(astrolabeForm.calendarType.value === "lunar" ? "农历" : "阳历")}</span>
      </div>
      <button type="button">新建</button>
    </div>
    <div class="time-context">
      <strong>当前问盘上下文</strong>
      <div>
        ${["-10年", "-1年", "-1月", "-1日", "-1时", "子", "+1时", "+1日", "+1月", "+1年", "+10年", "今日"].map((label) => `<span>${label}</span>`).join("")}
      </div>
    </div>
    <div class="astrolabe-scroll">
      <div class="chart-board">
        ${chartSlots.map(([index, slot]) => renderChartPalace(palaceByIndex.get(index), slot)).join("")}
        ${renderChartCenter(profile)}
      </div>
    </div>
  `;
}

function renderChartCenter(profile) {
  const today = formatDate(new Date());
  const genderSymbol = profile.gender === "女" ? "♀" : "♂";
  return `
    <div class="chart-center">
      <section>
        <h3>${genderSymbol} 基本信息</h3>
        <dl class="center-grid">
          ${centerItem("五行局", profile.fiveElementsClass)}
          ${centerItem("年龄(虚岁)", `${getNominalAge(profile.solarDate)} 岁`)}
          ${centerItem("四柱", profile.chineseDate)}
          ${centerItem("阳历", profile.solarDate)}
          ${centerItem("农历", profile.lunarDate)}
          ${centerItem("时辰", `${profile.time}(${profile.timeRange})`)}
          ${centerItem("生肖", profile.zodiac)}
          ${centerItem("星座", profile.sign)}
          ${centerItem("命主", profile.soul)}
          ${centerItem("身主", profile.body)}
          ${centerItem("命宫", profile.soulPalaceBranch)}
          ${centerItem("身宫", profile.bodyPalaceBranch)}
        </dl>
      </section>
      <section class="fortune-panel">
        <h3>运限信息</h3>
        <dl class="center-grid">
          ${centerItem("农历", "二〇二六年五月十四")}
          ${centerItem("阳历", today)}
        </dl>
      </section>
      <span class="powered">Powered by iztro</span>
    </div>
  `;
}

function centerItem(label, value) {
  return `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value || "-")}</dd></div>`;
}

function renderChartPalace(palace, slot) {
  if (!palace) {
    return "";
  }
  const mainStars = palace.majorStars.map((star) => renderChartStar(star, "major")).join("");
  const sideStars = palace.minorStars.concat(palace.adjectiveStars).slice(0, 9);
  const leftSideStars = sideStars.filter((_, index) => index % 2 === 0).map((star) => renderChartStar(star)).join("");
  const rightSideStars = sideStars.filter((_, index) => index % 2 === 1).map((star) => renderChartStar(star)).join("");
  const bodyMark = palace.isBodyPalace ? "<span class=\"body-mark\">身宫</span>" : "";
  const originalMark = palace.isOriginalPalace ? "<span class=\"body-mark\">来因</span>" : "";
  const ages = palace.ages?.slice(0, 8).map((age) => `<span>${escapeHtml(age)}</span>`).join("") || "";
  const decadal = palace.decadal?.range?.join(" - ") || "-";

  return `
    <article class="chart-palace ${slot}">
      <div class="palace-stars">
        <div class="star-column left-stars">
          ${mainStars || "<span class=\"major\">无主星</span>"}
          ${leftSideStars}
        </div>
        <div class="star-column right-stars">${rightSideStars}</div>
      </div>
      <div class="palace-limits">
        <div class="cycle-left">
          <span>${escapeHtml(palace.changsheng12)}</span>
          <span>${escapeHtml(palace.boshi12)}</span>
        </div>
        <div class="age-band">
          <div>${ages}</div>
          <strong>${escapeHtml(decadal)}</strong>
        </div>
        <div class="cycle-right">
          <span>${escapeHtml(palace.jiangqian12)}</span>
          <span>${escapeHtml(palace.suiqian12)}</span>
        </div>
      </div>
      <div class="palace-footer">
        <div>
          <strong>${escapeHtml(palace.name)}</strong>
          ${bodyMark}${originalMark}
        </div>
        <span>${escapeHtml(palace.heavenlyStem)}${escapeHtml(palace.earthlyBranch)}</span>
      </div>
    </article>
  `;
}

function renderChartStar(star, className = "") {
  const mutagen = star.mutagen ? `化${star.mutagen}` : "";
  const brightness = star.brightness ? ` ${star.brightness}` : "";
  return `<span class="${className} ${mutagen ? "with-mutagen" : ""}">${escapeHtml(star.name)}${escapeHtml(mutagen)}${escapeHtml(brightness)}</span>`;
}

function getNominalAge(solarDate) {
  const year = Number(String(solarDate).split("-")[0]);
  const currentYear = new Date().getFullYear();
  return Number.isFinite(year) ? currentYear - year + 1 : "-";
}

function formatDate(date) {
  return [
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  ].join("-");
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
