const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

// '#abc', 'abc', '#aabbcc', 'aabbcc' 형식을 '#aabbcc'로 정규화. 잘못된 값이면 null
export const normalizeHex = (text) => {
  const match = HEX_RE.exec(String(text).trim());
  if (!match) return null;
  let hex = match[1].toLowerCase();
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  return `#${hex}`;
};

const hexToRgb = (hex) => {
  const value = normalizeHex(hex);
  if (!value) return null;
  return {
    r: parseInt(value.slice(1, 3), 16),
    g: parseInt(value.slice(3, 5), 16),
    b: parseInt(value.slice(5, 7), 16),
  };
};

// 배경색 위에 올릴 글자색 (밝은 배경 → 어두운 글자, 어두운 배경 → 흰 글자)
export const getContrastTextColor = (hex) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#0f172a';
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.6 ? '#0f172a' : '#ffffff';
};

// h: 0~360, s/v: 0~1
export const hsvToHex = (h, s, v) => {
  const f = (n) => {
    const k = (n + h / 60) % 6;
    const value = v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
    return Math.round(value * 255)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(5)}${f(3)}${f(1)}`;
};

export const hexToHsv = (hex) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return { h: 0, s: 1, v: 1 };
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
};
