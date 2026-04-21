export const CHILD_FONT_FAMILIES = [
  'Gaegu',
  'Dongle',
  'Do Hyeon',
  'Jua',
  'Gamja Flower',
  'Black Han Sans',
  'Hi Melody',
  'Yeon Sung',
  'Single Day',
  'Poor Story',
  'Kirang Haerang',
  'Nanum Pen Script',
  'Nanum Brush Script',
  'Cute Font',
  'East Sea Dokdo',
] as const;

export function pickChildFont(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % CHILD_FONT_FAMILIES.length;
  return CHILD_FONT_FAMILIES[idx];
}

export function childFontStack(key: string): string {
  return `'${pickChildFont(key)}', sans-serif`;
}
