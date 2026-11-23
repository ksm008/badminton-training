import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import ColorPaletteModal from './ColorPaletteModal';
import useSavedColors from '../hooks/useSavedColors';

export const PRESET_COLORS = [
  '#ef4444', // 빨강
  '#fca5a5', // 연한 빨강
  '#fb923c', // 주황
  '#facc15', // 노랑
  '#4ade80', // 초록
  '#60a5fa', // 파랑
  '#a78bfa', // 보라
  '#1e293b', // 검정
];

// 기본 색 + 내가 저장한 색(오른쪽 끝에 추가) 중에서 고르거나, '직접 선택' 팔레트로 새 색을 고르는 컴포넌트
export default function ColorPicker({ value, onChange, disabled = false }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { savedColors, addColor, removeColor } = useSavedColors();

  const handlePaletteSelect = (hex) => {
    setPaletteOpen(false);
    if (!PRESET_COLORS.includes(hex)) addColor(hex);
    onChange(hex);
  };

  const confirmRemove = (color) => {
    Alert.alert('저장한 색 삭제', `${color.toUpperCase()} 색을 목록에서 지울까요?`, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => removeColor(color) },
    ]);
  };

  const renderSwatch = (color, isSaved) => {
    const selected = color === value;
    return (
      <Pressable
        key={`${isSaved ? 'saved' : 'preset'}-${color}`}
        accessibilityRole="button"
        accessibilityLabel={`${isSaved ? '저장한 색상' : '색상'} ${color}`}
        accessibilityHint={isSaved ? '길게 누르면 삭제' : undefined}
        accessibilityState={{ selected, disabled }}
        disabled={disabled}
        onPress={() => onChange(color)}
        onLongPress={isSaved ? () => confirmRemove(color) : undefined}
        style={[styles.swatch, { backgroundColor: color }, selected && styles.swatchSelected]}
      />
    );
  };

  return (
    <View style={[styles.container, disabled && styles.disabled]}>
      <View style={styles.swatchGrid}>
        {PRESET_COLORS.map((color) => renderSwatch(color, false))}
        {savedColors.map((color) => renderSwatch(color, true))}
      </View>

      <View style={styles.customRow}>
        <View style={[styles.preview, { backgroundColor: value }]} />
        <Text style={styles.currentText}>{value.toUpperCase()}</Text>
        <Pressable
          accessibilityRole="button"
          disabled={disabled}
          onPress={() => setPaletteOpen(true)}
          style={({ pressed }) => [styles.customButton, pressed && styles.customButtonPressed]}
        >
          <Text style={styles.customButtonText}>직접 선택</Text>
        </Pressable>
      </View>
      {savedColors.length > 0 && (
        <Text style={styles.hint}>직접 고른 색은 길게 누르면 삭제할 수 있어요.</Text>
      )}

      <ColorPaletteModal
        visible={paletteOpen}
        initialColor={value}
        onCancel={() => setPaletteOpen(false)}
        onSelect={handlePaletteSelect}
      />
    </View>
  );
}

const SWATCH_SIZE = 30;

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  disabled: {
    opacity: 0.5,
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  swatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: SWATCH_SIZE / 2,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  swatchSelected: {
    borderWidth: 3,
    borderColor: '#0f172a',
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preview: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginRight: 8,
  },
  currentText: {
    flex: 1,
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
  customButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0284c7',
    backgroundColor: '#ffffff',
  },
  customButtonPressed: {
    backgroundColor: '#e0f2fe',
  },
  customButtonText: {
    color: '#0284c7',
    fontSize: 14,
    fontWeight: 'bold',
  },
  hint: {
    color: '#94a3b8',
    fontSize: 12,
  },
});
