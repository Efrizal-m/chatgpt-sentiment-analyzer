const socialMediaPattern = /@[A-Za-z0-9_]+/;
const urlPatterns = /^(https?:\/\/|www\.)\S+/;

const arabicPattern = /[\u0600-\u06FF]/; // Arab
const chinesePattern = /[\u4E00-\u9FFF]/; // Cina
const cyrillicPattern = /[\u0400-\u04FF]/; // Kiril
const devanagariPattern = /[\u0900-\u097F]/; // Devanagari
const hangulPattern = /[\uAC00-\uD7AF]/; // Hangul
const kanaPattern = /[\u3040-\u309F\u30A0-\u30FF]/; // Kana
const thaiPattern = /[\u0E00-\u0E7F]/; // Thai

function isNonLatinScript(keyword: string): boolean {
    return (
      arabicPattern.test(keyword) ||
      chinesePattern.test(keyword) ||
      cyrillicPattern.test(keyword) ||
      devanagariPattern.test(keyword) ||
      hangulPattern.test(keyword) ||
      kanaPattern.test(keyword) ||
      thaiPattern.test(keyword)
    );
  }

export const validateKeywordInput = (q = ''): boolean => {
    if (socialMediaPattern.test(q)) return false;
    if (urlPatterns.test(q)) return false;
    if (isNonLatinScript(q)) return false 
    return true;
};