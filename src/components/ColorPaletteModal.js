import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getContrastTextColor, hexToHsv, hsvToHex } from '../utils/color';

const HUE_COLORS = ['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ff0000'];
const THUMB_SIZE = 24;

const clamp01 = (n) => Math.min(1, Math.max(0, n));

// 터치/드래그 위치를 0~1 비율로 알려주는 영역. 자식이 없는 투명 오버레이에서 좌표를 받아
// locationX/Y가 항상 이 영역 기준이 되도록 함
function TouchArea({ size, onChange }) {
  const handle = (e) => {
    if (!size.width || !size.height) return;
    onChange(
      clamp01(e.nativeEvent.locationX / size.width),
      clamp01(e.nativeEvent.locationY / size.height)
    );
  };
  return (
    <View
      style={StyleSheet.absoluteFill}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={handle}
      onResponderMove={handle}
    />
  );
}

// 채도/명도 사각형 + 색상(Hue) 막대로 원하는 색을 고르는 팔레트
export default function ColorPaletteModal({ visible, initialColor, onCancel, onSelect }) {
  const [hsv, setHsv] = useState(() => hexToHsv(initialColor));
  const [wasVisible, setWasVisible] = useState(visible);
  const [svSize, setSvSize] = useState({ width: 0, height: 0 });
  const [hueSize, setHueSize] = useState({ width: 0, height: 0 });

  // 팔레트를 열 때마다 현재 색에서 시작
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setHsv(hexToHsv(initialColor));
  }

  const hex = hsvToHex(hsv.h, hsv.s, hsv.v);
  const pureHue = hsvToHex(hsv.h, 1, 1);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>색상 직접 선택</Text>

          {/* 채도(가로) / 명도(세로) */}
          <View
            style={[styles.svBox, { backgroundColor: pureHue }]}
            onLayout={(e) => setSvSize(e.nativeEvent.layout)}
          >
            <LinearGradient
              colors={['#ffffff', 'rgba(255,255,255,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <LinearGradient
              colors={['rgba(0,0,0,0)', '#000000']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <View
              pointerEvents="none"
              style={[
                styles.thumb,
                {
                  left: hsv.s * svSize.width - THUMB_SIZE / 2,
                  top: (1 - hsv.v) * svSize.height - THUMB_SIZE / 2,
                  backgroundColor: hex,
                },
              ]}
            />
            <TouchArea
              size={svSize}
              onChange={(x, y) => setHsv((prev) => ({ ...prev, s: x, v: 1 - y }))}
            />
          </View>

          {/* 색상(Hue) */}
          <View style={styles.hueBar} onLayout={(e) => setHueSize(e.nativeEvent.layout)}>
            <LinearGradient
              colors={HUE_COLORS}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[StyleSheet.absoluteFill, styles.hueGradient]}
              pointerEvents="none"
            />
            <View
              pointerEvents="none"
              style={[
                styles.thumb,
                styles.hueThumb,
                { left: (hsv.h / 360) * hueSize.width - THUMB_SIZE / 2, backgroundColor: pureHue },
              ]}
            />
            <TouchArea
              size={hueSize}
              onChange={(x) => setHsv((prev) => ({ ...prev, h: Math.min(x * 360, 359.9) }))}
            />
          </View>

          <View style={[styles.preview, { backgroundColor: hex }]}>
            <Text style={[styles.previewText, { color: getContrastTextColor(hex) }]}>
              {hex.toUpperCase()}
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <Pressable
              accessibilityRole="button"
              onPress={onCancel}
              style={[styles.button, styles.cancelButton]}
            >
              <Text style={styles.cancelText}>취소</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => onSelect(hex)}
              style={[styles.button, styles.selectButton]}
            >
              <Text style={styles.selectText}>이 색 사용</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
  },
  svBox: {
    width: '100%',
    aspectRatio: 1.25,
    borderRadius: 10,
    overflow: 'hidden',
  },
  hueBar: {
    width: '100%',
    height: 28,
    justifyContent: 'center',
  },
  hueGradient: {
    borderRadius: 14,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  hueThumb: {
    top: (28 - THUMB_SIZE) / 2,
  },
  preview: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
  },
  selectButton: {
    backgroundColor: '#0284c7',
  },
  cancelText: {
    color: '#334155',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
