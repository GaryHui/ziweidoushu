const { astro } = require("iztro");

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
