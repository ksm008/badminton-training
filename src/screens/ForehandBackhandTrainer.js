import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Animated,
  Keyboard,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import KeepAwake from '../components/KeepAwake';
import Checkbox from '../components/Checkbox';
import ColorPicker from '../components/ColorPicker';
import { parseNumber } from '../utils/parseNumber';
import { getContrastTextColor } from '../utils/color';

const CONTROL_BAR_HEIGHT = 70;
const COUNTDOWN_SECONDS = 3;
const MIN_INTERVAL_SEC = 0.3;
const MAX_FLASH_MS = 600; // 신호 사각형이 떠 있는 최대 시간
const DEFAULT_SIGNAL_COLOR = '#fca5a5'; // 연한 빨강
const SIGNAL_SECTION_PADDING = 20;
const SIDES = ['left', 'right'];
const pickRandomSide = () => SIDES[Math.floor(Math.random() * SIDES.length)];

export default function ForehandBackhandTrainer() {
  const [durationInput, setDurationInput] = useState('60');
  const [intervalInput, setIntervalInput] = useState('1.5');

  // 옵션
  const [isLeftHanded, setIsLeftHanded] = useState(false); // 왼손잡이: 포핸드가 왼쪽
  const [showLabels, setShowLabels] = useState(true);
  const [signalColor, setSignalColor] = useState(DEFAULT_SIGNAL_COLOR);

  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [activeSide, setActiveSide] = useState(null);
  const [countdown, setCountdown] = useState(null);

  const [configHeight, setConfigHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [animProgress] = useState(() => new Animated.Value(0));

  const isRunningRef = useRef(false);
  const mainTimerRef = useRef(null);
  const stepTimeoutRef = useRef(null);
  const hideTimeoutRef = useRef(null);
  const countdownTimerRef = useRef(null);

  const clearAllTimers = useCallback(() => {
    clearInterval(countdownTimerRef.current);
    clearInterval(mainTimerRef.current);
    clearTimeout(stepTimeoutRef.current);
    clearTimeout(hideTimeoutRef.current);
    countdownTimerRef.current = null;
    mainTimerRef.current = null;
    stepTimeoutRef.current = null;
    hideTimeoutRef.current = null;
  }, []);

  const animateTo = (toValue) => {
    Animated.timing(animProgress, {
      toValue,
      duration: 450,
      useNativeDriver: true,
    }).start();
  };

  const stopTraining = () => {
    isRunningRef.current = false;
    clearAllTimers();
    setIsRunning(false);
    setActiveSide(null);
    setCountdown(null);
    animateTo(0);
  };

  // 왼쪽/오른쪽 중 하나를 무작위로 잠깐 띄웠다가 끄고, intervalMs 뒤에 다음 신호
  const scheduleNextSignal = (intervalMs, flashMs) => {
    if (!isRunningRef.current) return;

    setActiveSide(pickRandomSide());

    hideTimeoutRef.current = setTimeout(() => setActiveSide(null), flashMs);
    stepTimeoutRef.current = setTimeout(() => {
      scheduleNextSignal(intervalMs, flashMs);
    }, intervalMs);
  };

  const beginActualTraining = (intervalMs, totalSec) => {
    // 신호가 연속으로 같은 쪽이어도 구분되도록 간격보다 짧게 표시
    const flashMs = Math.min(MAX_FLASH_MS, intervalMs * 0.6);
    scheduleNextSignal(intervalMs, flashMs);

    // 종료 시각 기준으로 남은 시간을 계산해 setInterval 지연이 누적되지 않도록 함
    const endAt = Date.now() + totalSec * 1000;
    mainTimerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) stopTraining();
    }, 250);
  };

  const startTraining = () => {
    Keyboard.dismiss();

    const totalSec = parseNumber(durationInput);
    const intervalSec = parseNumber(intervalInput);

    if (
      !Number.isInteger(totalSec) ||
      totalSec <= 0 ||
      !Number.isFinite(intervalSec) ||
      intervalSec <= MIN_INTERVAL_SEC
    ) {
      Alert.alert(
        '입력값 확인',
        `진행 시간은 1 이상의 정수, 간격 시간은 ${MIN_INTERVAL_SEC}초보다 크게 입력해줘.`
      );
      return;
    }

    const intervalMs = intervalSec * 1000;

    clearAllTimers();
    setTimeLeft(totalSec);
    setIsRunning(true);
    isRunningRef.current = true;
    setCountdown(COUNTDOWN_SECONDS);
    animateTo(1);

    let count = COUNTDOWN_SECONDS;
    countdownTimerRef.current = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
        return;
      }
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
      setCountdown(null);
      if (isRunningRef.current) {
        beginActualTraining(intervalMs, totalSec);
      }
    }, 1000);
  };

  useEffect(() => {
    return () => {
      isRunningRef.current = false;
      clearAllTimers();
    };
  }, [clearAllTimers]);

  // 시작하면 설정 영역이 위로 밀려나면서 화면이 아래(신호 영역)로 내려감
  const containerTranslateY = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -configHeight],
  });

  const signalExtraTranslateY = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  const signalOpacity = animProgress.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0, 1],
  });

  const signalSectionHeight = Math.max(0, viewportHeight - CONTROL_BAR_HEIGHT);
  // 신호 사각형은 신호 영역의 1/3 높이로 가운데 배치
  const signalRowHeight = Math.max(0, (signalSectionHeight - SIGNAL_SECTION_PADDING * 2) / 3);
  const signalTextColor = getContrastTextColor(signalColor);

  // 오른손잡이: 왼쪽 = 백핸드, 오른쪽 = 포핸드 / 왼손잡이는 반대
  const getStrokeLabel = (side) => {
    const isForehand = isLeftHanded ? side === 'left' : side === 'right';
    return isForehand ? '포핸드' : '백핸드';
  };

  const renderSignalBox = (side) => {
    const isActive = activeSide === side;
    return (
      <View
        style={[
          styles.signalBox,
          isActive && { backgroundColor: signalColor, borderColor: signalColor, borderStyle: 'solid' },
        ]}
      >
        {showLabels && (
          <Text
            style={[
              styles.signalLabel,
              isActive && [styles.signalLabelActive, { color: signalTextColor }],
            ]}
          >
            {getStrokeLabel(side)}
          </Text>
        )}
      </View>
    );
  };

  return (
    // 상단 영역은 Stack 헤더가 처리하므로 top 엣지는 제외
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      {isRunning && <KeepAwake />}
      <View
        style={styles.viewport}
        onLayout={(e) => setViewportHeight(e.nativeEvent.layout.height)}
      >
        <Animated.View
          style={[
            styles.slidingContainer,
            { transform: [{ translateY: containerTranslateY }] },
          ]}
        >
          {/* 1. 설정 영역 */}
          <View
            style={styles.configWrapper}
            onLayout={(e) => setConfigHeight(e.nativeEvent.layout.height)}
          >
            <View style={styles.configPanel}>
              <Text style={styles.sectionTitle}>1. 전체 진행 시간 (초)</Text>
              <TextInput
                style={[styles.textInput, { marginBottom: 14 }]}
                keyboardType="number-pad"
                value={durationInput}
                onChangeText={setDurationInput}
                editable={!isRunning}
              />

              <Text style={styles.sectionTitle}>2. 간격 시간 (초)</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="decimal-pad"
                value={intervalInput}
                onChangeText={setIntervalInput}
                editable={!isRunning}
              />

              <Text style={[styles.sectionTitle, { marginTop: 14, marginBottom: 2 }]}>3. 옵션</Text>
              <Checkbox
                label="왼손잡이 (포핸드/백핸드 위치 바꾸기)"
                checked={isLeftHanded}
                onChange={setIsLeftHanded}
                disabled={isRunning}
              />
              <Checkbox
                label="포핸드/백핸드 문구 표시"
                checked={showLabels}
                onChange={setShowLabels}
                disabled={isRunning}
              />

              <Text style={[styles.sectionTitle, { marginTop: 12 }]}>4. 신호 색상</Text>
              <ColorPicker value={signalColor} onChange={setSignalColor} disabled={isRunning} />
            </View>
          </View>

          {/* 2. 컨트롤 바 */}
          <View style={styles.controlBar}>
            <Text style={styles.timerText}>
              남은 시간:{' '}
              <Text style={styles.timerHighlight}>
                {isRunning ? timeLeft : durationInput}
              </Text>
              초
            </Text>
            <TouchableOpacity
              style={[styles.actionBtn, isRunning ? styles.stopBtn : styles.startBtn]}
              onPress={isRunning ? stopTraining : startTraining}
              accessibilityRole="button"
              accessibilityLabel={isRunning ? '훈련 중지' : '훈련 시작'}
            >
              <Text style={styles.actionBtnText}>{isRunning ? '중지' : '시작'}</Text>
            </TouchableOpacity>
          </View>

          {/* 3. 방향 신호 영역 */}
          <Animated.View
            pointerEvents={isRunning ? 'auto' : 'none'}
            style={[
              styles.signalSection,
              {
                height: signalSectionHeight,
                opacity: signalOpacity,
                transform: [{ translateY: signalExtraTranslateY }],
              },
            ]}
          >
            <View style={[styles.signalRow, { height: signalRowHeight }]}>
              {renderSignalBox('left')}
              {renderSignalBox('right')}
            </View>

            {countdown !== null && (
              <View pointerEvents="none" style={styles.countdownOverlay}>
                <Text style={styles.countdownText}>{countdown}</Text>
              </View>
            )}
          </Animated.View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  viewport: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  slidingContainer: {
    width: '100%',
    paddingHorizontal: 16,
  },
  configWrapper: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  configPanel: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: '#ffffff',
    color: '#0f172a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    textAlign: 'center',
  },
  controlBar: {
    width: '100%',
    height: CONTROL_BAR_HEIGHT,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  timerText: {
    color: '#1e293b',
    fontSize: 18,
    fontWeight: '700',
  },
  timerHighlight: {
    color: '#0284c7',
    fontSize: 24,
    fontWeight: 'bold',
  },
  actionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 8,
  },
  startBtn: {
    backgroundColor: '#16a34a',
  },
  stopBtn: {
    backgroundColor: '#dc2626',
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signalSection: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIGNAL_SECTION_PADDING,
  },
  signalRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
  },
  signalBox: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signalLabel: {
    color: '#cbd5e1',
    fontSize: 20,
    fontWeight: '700',
  },
  signalLabelActive: {
    fontSize: 28,
  },
  countdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  countdownText: {
    color: '#ffffff',
    fontSize: 96,
    fontWeight: '900',
  },
});
