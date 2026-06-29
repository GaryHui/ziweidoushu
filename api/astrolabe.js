const { astro } = require("iztro");

const MUTAGEN_BY_STEM = {
  "甲": { lu: "廉贞", quan: "破军", ke: "武曲", ji: "太阳" },
  "乙": { lu: "天机", quan: "天梁", ke: "紫微", ji: "太阴" },
  "丙": { lu: "天同", quan: "天机", ke: "文昌", ji: "廉贞" },
  "丁": { lu: "太阴", quan: "天同", ke: "天机", ji: "巨门" },
  "戊": { lu: "贪狼", quan: "太阳", ke: "右弼", ji: "天机" },
  "己": { lu: "武曲", quan: "贪狼", ke: "天梁", ji: "文曲" },
  "庚": { lu: "太阳", quan: "武曲", ke: "天府", ji: "天同" },
  "辛": { lu: "巨门", quan: "太阳", ke: "文曲", ji: "文昌" },
  "壬": { lu: "天梁", quan: "紫微", ke: "左辅", ji: "武曲" },
  "癸": { lu: "破军", quan: "巨门", ke: "太阴", ji: "贪狼" }
};

module.exports = function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const payload = buildAstrolabe(body);
    res.status(200).json(payload);
  } catch (error) {
    res.status(400).json({
      error: "无法生成命盘，请检查日期、时辰、性别和历法。",
      detail: error.message
    });
  }
};

function buildAstrolabe(input) {
  const date = String(input.date || "").trim();
  const timeIndex = Number(input.timeIndex);
  const gender = input.gender === "female" ? "女" : "男";
  const isLeapMonth = Boolean(input.isLeapMonth);
  const fixLeap = true;
  const language = "zh-CN";

  if (!/^\d{4}-\d{1,2}-\d{1,2}$/.test(date)) {
    throw new Error("日期格式应为 YYYY-M-D。");
  }

  if (!Number.isInteger(timeIndex) || timeIndex < 0 || timeIndex > 12) {
    throw new Error("时辰编号应在 0 到 12 之间。");
  }

  const astrolabe = input.calendarType === "lunar"
    ? astro.byLunar(date, timeIndex, gender, isLeapMonth, fixLeap, language)
    : astro.bySolar(date, timeIndex, gender, fixLeap, language);
  const birthYearStem = astrolabe.chineseDate?.trim()?.[0] || "";

  return {
    profile: {
      gender: astrolabe.gender,
      solarDate: astrolabe.solarDate,
      lunarDate: astrolabe.lunarDate,
      chineseDate: astrolabe.chineseDate,
      time: astrolabe.time,
      timeRange: astrolabe.timeRange,
      sign: astrolabe.sign,
      zodiac: astrolabe.zodiac,
      soul: astrolabe.soul,
      body: astrolabe.body,
      fiveElementsClass: astrolabe.fiveElementsClass,
      birthYearStem,
      birthYearMutagens: MUTAGEN_BY_STEM[birthYearStem] || null,
      soulPalaceBranch: astrolabe.earthlyBranchOfSoulPalace,
      bodyPalaceBranch: astrolabe.earthlyBranchOfBodyPalace
    },
    palaces: astrolabe.palaces.map((palace) => ({
      index: palace.index,
      name: palace.name,
      isBodyPalace: palace.isBodyPalace,
      isOriginalPalace: palace.isOriginalPalace,
      heavenlyStem: palace.heavenlyStem,
      earthlyBranch: palace.earthlyBranch,
      majorStars: palace.majorStars.map(formatStar),
      minorStars: palace.minorStars.map(formatStar),
      adjectiveStars: palace.adjectiveStars.map(formatStar),
      changsheng12: palace.changsheng12,
      boshi12: palace.boshi12,
      jiangqian12: palace.jiangqian12,
      suiqian12: palace.suiqian12,
      decadal: palace.decadal,
      ages: palace.ages
    }))
  };
}

function formatStar(star) {
  return {
    name: star.name,
    brightness: star.brightness || "",
    mutagen: star.mutagen || "",
    type: star.type || ""
  };
}
