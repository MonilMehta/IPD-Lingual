import { View, Text, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import LandingScreen from '../../screens/LandingScreen';

export default function Landing() {
  const router = useRouter();
  
  return (
     <LandingScreen />

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  heading: {
    fontSize: 28,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    marginBottom: 20,
  },
});
