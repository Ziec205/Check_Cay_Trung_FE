// Giống backend/src/calc.js: 201 -> 20 kg nguyên, dư 0,1 kg.
export function summarize(values) {
  const byKg = {};
  let wholeKg = 0;
  let remTenths = 0;
  for (const v of values) {
    const kg = Math.floor(v / 10);
    byKg[kg] = (byKg[kg] || 0) + 1;
    wholeKg += kg;
    remTenths += v % 10;
  }
  return { count: values.length, byKg, wholeKg, remKg: remTenths / 10, totalKg: (wholeKg * 10 + remTenths) / 10 };
}

// Tách chuỗi người dùng nhập thành các số; trả về số hợp lệ và các phần bị sai.
export function parseNumbers(text) {
  const tokens = text.match(/\d+/g) || [];
  const values = [];
  const invalid = [];
  for (const t of tokens) {
    if (t.length === 3) values.push(Number(t));
    else invalid.push(t);
  }
  return { values, invalid };
}

export const fmt1 = (n) => n.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function monthLabel(m) {
  const [y, mm] = m.split('-');
  return `Tháng ${Number(mm)}/${y}`;
}

export const todayStr = () => new Date().toLocaleDateString('sv-SE');

export const dateLabel = (d) => d.split('-').reverse().join('/');

// Số lạ so với dải thường gặp, để nhắc kiểm tra lại.
export const isOdd = (v) => v < 150 || v > 299;
