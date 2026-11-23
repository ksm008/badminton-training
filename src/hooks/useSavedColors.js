import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizeHex } from '../utils/color';

const STORAGE_KEY = 'savedSignalColors';
const MAX_SAVED_COLORS = 6;

// 사용자가 '직접 선택'으로 고른 색 목록 (앱을 다시 켜도 유지, 두 연습 페이지가 공유)
export default function useSavedColors() {
  const [savedColors, setSavedColors] = useState([]);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled || !raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setSavedColors(parsed.map(normalizeHex).filter(Boolean).slice(-MAX_SAVED_COLORS));
        }
      })
      .catch(() => {}); // 저장된 값이 깨져 있으면 빈 목록으로 시작
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = (colors) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(colors)).catch(() => {});
    return colors;
  };

  // 새 색은 목록의 가장 오른쪽(끝)에 추가. 이미 있으면 끝으로 옮김. 최대 개수를 넘으면 오래된 것부터 삭제
  const addColor = useCallback((color) => {
    const hex = normalizeHex(color);
    if (!hex) return;
    setSavedColors((prev) =>
      persist([...prev.filter((c) => c !== hex), hex].slice(-MAX_SAVED_COLORS))
    );
  }, []);

  const removeColor = useCallback((color) => {
    setSavedColors((prev) => persist(prev.filter((c) => c !== color)));
  }, []);

  return { savedColors, addColor, removeColor };
}
