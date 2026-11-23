import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function Checkbox({ label, checked, onChange, disabled = false }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      onPress={() => onChange(!checked)}
      disabled={disabled}
      hitSlop={6}
      style={[styles.row, disabled && styles.disabled]}
    >
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked && <Text style={styles.check}>✓</Text>}
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  disabled: {
    opacity: 0.5,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#94a3b8',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  boxChecked: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  check: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 16,
  },
  label: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
});
