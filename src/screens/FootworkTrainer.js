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
import { parseNumber } from '../utils/parseNumber';
import ColorPicker from '../components/ColorPicker';

const CONTROL_BAR_HEIGHT = 70;
const COUNTDOWN_SECONDS = 3;
const BLINK_GAP_MS = 150; // 같은 구역이 연속으로 나와도 깜빡임으로 구분되도록 비우는 시간
const MIN_INTERVAL_SEC = 0.2;
const DEFAULT_HIGHLIGHT_COLOR = '#ef4444';

// 3행 2열 순서 (위에서부터 전위 -> 중앙 -> 후위)
const ZONES = [
  { id: 'FL', label: '왼 전위', col: 0, pos: 'front' },
  { id: 'FR', label: '오른 전위', col: 1, pos: 'front' },
  { id: 'ML', label: '왼 중앙', col: 0, pos: 'mid' },
  { id: 'MR', label: '오른 중앙', col: 1, pos: 'mid' },
  { id: 'BL', label: '왼 후위', col: 0, pos: 'back' },
  { id: 'BR', label: '오른 후위', col: 1, pos: 'back' },
];
const ZONE_BY_ID = Object.fromEntries(ZONES.map((z) => [z.id, z]));

export default function FootworkTrainer() {
  const [selectedZones, setSelectedZones] = useState(ZONES.map((z) => z.id));
  const [durationInput, setDurationInput] = useState('60');

  // 기본값: 전위 1.8, 중앙 1.5, 후위 2.0
  const [frontInterval, setFrontInterval] = useState('1.8');
  const [midInterval, setMidInterval] = useState('1.5');
  const [backInterval, setBackInterval] = useState('2.0');
  const [highlightColor, setHighlightColor] = useState(DEFAULT_HIGHLIGHT_COLOR);

  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [activeZone, setActiveZone] = useState(null);
  const [countdown, setCountdown] = useState(null);

  const [configHeight, setConfigHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [animProgress] = useState(() => new Animated.Value(0));

  const isRunningRef = useRef(false);
  const mainTimerRef = useRef(null);
  const stepTimeoutRef = useRef(null);
  const blinkTimeoutRef = useRef(null);
  const countdownTimerRef = useRef(null);

  const clearAllTimers = useCallback(() => {
    clearInterval(countdownTimerRef.current);
    clearInterval(mainTimerRef.current);
    clearTimeout(stepTimeoutRef.current);
    clearTimeout(blinkTimeoutRef.current);
    countdownTimerRef.current = null;
    mainTimerRef.current = null;
    stepTimeoutRef.current = null;
    blinkTimeoutRef.current = null;
  }, []);

  const toggleZone = (id) => {
    if (isRunning) return;
    setSelectedZones((prev) =>
      prev.includes(id)
        ? prev.length > 1
          ? prev.filter((item) => item !== id)
          : prev
        : [...prev, id]
    );
  };

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
    setActiveZone(null);
    setCountdown(null);
    animateTo(0);
  };

  // intervalsMs: 시작 시점에 확정된 구역별 간격(ms). 매 스텝마다 입력값을 다시 파싱하지 않음.
  const scheduleNextStep = (zoneIds, intervalsMs) => {
    if (!isRunningRef.current) return;

    setActiveZone(null);
    blinkTimeoutRef.current = setTimeout(() => {
      if (!isRunningRef.current) return;

      const nextZoneId = zoneIds[Math.floor(Math.random() * zoneIds.length)];
      setActiveZone(nextZoneId);

      stepTimeoutRef.current = setTimeout(() => {
        scheduleNextStep(zoneIds, intervalsMs);
      }, intervalsMs[ZONE_BY_ID[nextZoneId].pos]);
    }, BLINK_GAP_MS);
  };

  const beginActualTraining = (zoneIds, intervalsMs, totalSec) => {
    scheduleNextStep(zoneIds, intervalsMs);

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
    const intervalsSec = {
      front: parseNumber(frontInterval),
      mid: parseNumber(midInterval),
      back: parseNumber(backInterval),
    };

    const isValidInterval = (v) => Number.isFinite(v) && v > MIN_INTERVAL_SEC;
    if (
      !Number.isInteger(totalSec) ||
      totalSec <= 0 ||
      !Object.values(intervalsSec).every(isValidInterval)
    ) {
      Alert.alert(
        '입력값 확인',
        `진행 시간은 1 이상의 정수, 각 구역의 간격 시간은 ${MIN_INTERVAL_SEC}초보다 크게 입력해줘.`
      );
      return;
    }

    const intervalsMs = {
      front: intervalsSec.front * 1000,
      mid: intervalsSec.mid * 1000,
      back: intervalsSec.back * 1000,
    };
    const zoneIds = [...selectedZones];

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
        beginActualTraining(zoneIds, intervalsMs, totalSec);
      }
    }, 1000);
  };

  useEffect(() => {
    return () => {
      isRunningRef.current = false;
      clearAllTimers();
    };
  }, [clearAllTimers]);

  const renderCourtColumn = (colIndex) => {
    const colZones = ZONES.filter((z) => z.col === colIndex);
    const activeInCol = colZones.find((z) => z.id === activeZone);

    return (
      <View style={[styles.courtCol, colIndex === 0 && styles.courtColLeft]}>
        <View style={styles.baseHalfTop} />
        <View style={styles.baseHalfBottom} />

        {activeInCol && (
          <View
            style={[
              styles.highlightBox,
              { backgroundColor: highlightColor },
              activeInCol.pos === 'front' && styles.posFront,
              activeInCol.pos === 'mid' && styles.posMid,
              activeInCol.pos === 'back' && styles.posBack,
            ]}
          />
        )}
      </View>
    );
  };

  const containerTranslateY = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -configHeight],
  });

  const courtExtraTranslateY = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  const courtOpacity = animProgress.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0, 1],
  });

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
              <Text style={styles.sectionTitle}>1. 풋워크 영역 선택</Text>
              {/* 3행 2열 그리드 (위에서부터 전위, 중앙, 후위) */}
              <View style={styles.zoneSelectorGrid}>
                {ZONES.map((zone) => {
                  const isSelected = selectedZones.includes(zone.id);
                  return (
                    <TouchableOpacity
                      key={zone.id}
                      style={[styles.zoneChip, isSelected && styles.zoneChipActive]}
                      onPress={() => toggleZone(zone.id)}
                      disabled={isRunning}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isSelected, disabled: isRunning }}
                    >
                      <Text
                        style={[
                          styles.zoneChipText,
                          isSelected && styles.zoneChipTextActive,
                        ]}
                      >
                        {zone.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.sectionTitle}>2. 전체 진행 시간 (초)</Text>
              <TextInput
                style={[styles.textInput, { marginBottom: 14 }]}
                keyboardType="number-pad"
                value={durationInput}
                onChangeText={setDurationInput}
                editable={!isRunning}
              />

              <Text style={styles.sectionTitle}>3. 구역별 간격 시간 (초)</Text>
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>전위</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="decimal-pad"
                    value={frontInterval}
                    onChangeText={setFrontInterval}
                    editable={!isRunning}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>중앙</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="decimal-pad"
                    value={midInterval}
                    onChangeText={setMidInterval}
                    editable={!isRunning}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>후위</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="decimal-pad"
                    value={backInterval}
                    onChangeText={setBackInterval}
                    editable={!isRunning}
                  />
                </View>
              </View>

              <Text style={[styles.sectionTitle, { marginTop: 14 }]}>4. 신호 색상</Text>
              <ColorPicker
                value={highlightColor}
                onChange={setHighlightColor}
                disabled={isRunning}
              />
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

          {/* 3. 배드민턴 코트 영역 */}
          <Animated.View
            pointerEvents={isRunning ? 'auto' : 'none'}
            style={[
              styles.courtSection,
              {
                height: Math.max(0, viewportHeight - CONTROL_BAR_HEIGHT),
                opacity: courtOpacity,
                transform: [{ translateY: courtExtraTranslateY }],
              },
            ]}
          >
            <View style={styles.courtWrapper}>
              <View style={styles.netBar} />
              <View style={styles.courtBody}>
                {renderCourtColumn(0)}
                {renderCourtColumn(1)}
              </View>

              {/* 코트 비율을 해치지 않도록 절대 위치(absolute)로 코트 위 정중앙을 덮는 반투명 오버레이 */}
              {countdown !== null && (
                <View pointerEvents="none" style={styles.countdownOverlay}>
                  <Text style={styles.countdownText}>{countdown}</Text>
                </View>
              )}
            </View>
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
  zoneSelectorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  // 3행 2열 배치를 위해 너비를 48.5%로 설정
  zoneChip: {
    width: '48.5%',
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  zoneChipActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  zoneChipText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  zoneChipTextActive: {
    color: '#ffffff',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
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
  courtSection: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  courtWrapper: {
    width: '100%',
    maxWidth: 340,
    aspectRatio: 0.78,
    backgroundColor: '#15803d',
    borderWidth: 3,
    borderColor: '#0f172a',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative', // 내부 오버레이의 기준점으로 고정
  },
  netBar: {
    width: '100%',
    height: 18,
    backgroundColor: '#1e293b',
    borderBottomWidth: 3,
    borderBottomColor: '#ffffff',
  },
  courtBody: {
    flex: 1,
    flexDirection: 'row',
  },
  courtCol: {
    flex: 1,
    position: 'relative',
  },
  courtColLeft: {
    borderRightWidth: 2,
    borderRightColor: '#ffffff',
  },
  baseHalfTop: {
    flex: 1,
    borderBottomWidth: 2,
    borderBottomColor: '#ffffff',
  },
  baseHalfBottom: {
    flex: 1,
  },
  highlightBox: {
    position: 'absolute',
    left: 0,
    right: 0,
    opacity: 0.88,
    zIndex: 1,
  },
  posFront: {
    top: '0%',
    height: '50%',
  },
  posMid: {
    top: '25%',
    height: '50%',
  },
  posBack: {
    top: '50%',
    height: '50%',
  },
  countdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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