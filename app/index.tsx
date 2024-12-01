import { router } from 'expo-router';
import LandingScreen from '../screens/LandingScreen';

export default function Index() {
  const navigation = {
    navigate: (screen: string) => router.push(`/(auth)/${screen.toLowerCase()}`),
  };

  return <LandingScreen navigation={navigation} />;
}