import { useKeepAwake } from 'expo-keep-awake';

// 마운트되어 있는 동안 화면이 꺼지지 않도록 유지 (훈련 중에만 렌더링해서 사용)
export default function KeepAwake() {
  useKeepAwake();
  return null;
}
