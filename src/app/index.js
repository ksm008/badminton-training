import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

const MENU_ITEMS = [
  { href: '/forehand-backhand', label: '포핸드/백핸드 전환 연습' },
  { href: '/footwork', label: '풋워크 연습' },
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>배드민턴 트레이너</Text>

        <View style={styles.menu}>
          {MENU_ITEMS.map((item) => (
            // Link asChild는 자식의 style을 StyleSheet.flatten으로 합치기 때문에
            // Pressable의 함수형 style이 사라짐 → router.push로 직접 이동
            <Pressable
              key={item.href}
              accessibilityRole="button"
              onPress={() => router.push(item.href)}
              style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed]}
            >
              <Text style={styles.menuButtonText}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 40,
  },
  menu: {
    width: '100%',
    maxWidth: 360,
    gap: 16,
  },
  menuButton: {
    width: '100%',
    paddingVertical: 20,
    borderRadius: 12,
    backgroundColor: '#0284c7',
    alignItems: 'center',
  },
  menuButtonPressed: {
    opacity: 0.8,
  },
  menuButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
