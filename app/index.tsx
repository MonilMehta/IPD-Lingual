import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function SplashScreen() {
  const router = useRouter();
  useEffect(() => {
    const timer = setTimeout(() => {
      // Updated navigation path to "/(landing)"
      router.replace('/(landing)');
    }, 3000);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Lingual</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: 'orange',
    fontSize: 32,
  },
});
