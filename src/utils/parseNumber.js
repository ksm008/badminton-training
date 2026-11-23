// 일부 키보드 로케일은 소수점으로 ','를 입력하므로 함께 허용
export const parseNumber = (text) => Number(String(text).trim().replace(',', '.'));
