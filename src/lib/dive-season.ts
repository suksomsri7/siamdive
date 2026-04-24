const EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const TH = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
const CN = ["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"];
const JA = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];
const KO = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];

export function currentMonth(): number {
  return new Date().getMonth();
}

export function monthName(lang: string): string {
  const m = currentMonth();
  if (lang === "th") return TH[m];
  if (lang === "cn") return CN[m];
  if (lang === "ja") return JA[m];
  if (lang === "ko") return KO[m];
  return EN[m];
}

export type SeasonInfo = {
  coast: "andaman" | "gulf" | "transition";
  whaleShark: boolean;
  mantaRay: boolean;
  similanOpen: boolean;
};

export function seasonInfo(): SeasonInfo {
  const m = currentMonth();
  return {
    coast: (m >= 10 || m <= 3) ? "andaman" : (m === 4 || m === 9) ? "transition" : "gulf",
    whaleShark: m >= 1 && m <= 4,
    mantaRay: m >= 10 || m <= 4,
    similanOpen: m >= 9 || m <= 4,
  };
}

export function seasonLabel(lang: string): string {
  const s = seasonInfo();
  if (s.coast === "andaman") {
    if (lang === "th") return "High Season ฝั่งอันดามัน";
    if (lang === "cn") return "安达曼海旺季";
    if (lang === "ja") return "アンダマン海ハイシーズン";
    if (lang === "ko") return "안다만해 성수기";
    return "Andaman Sea high season";
  }
  if (s.coast === "gulf") {
    if (lang === "th") return "Gulf Season ฝั่งอ่าวไทย";
    if (lang === "cn") return "泰国湾潜水季";
    if (lang === "ja") return "タイ湾ダイビングシーズン";
    if (lang === "ko") return "태국만 다이빙 시즌";
    return "Gulf of Thailand diving season";
  }
  if (lang === "th") return "ช่วงเปลี่ยนฤดู";
  if (lang === "cn") return "换季期";
  if (lang === "ja") return "シーズン移行期";
  if (lang === "ko") return "시즌 전환기";
  return "Season transition";
}
