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

const lessonList = document.querySelector("#lessonList");
const form = document.querySelector("#readingForm");
const result = document.querySelector("#result");

lessonList.innerHTML = lessons.map((lesson) => `
  <article class="lesson">
    <strong>${lesson.title}</strong>
    <span>${lesson.text}</span>
  </article>
`).join("");

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
