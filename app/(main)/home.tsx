import { View } from 'react-native';
import { router } from 'expo-router';
import HomeScreen from '../../screens/HomeScreen';

export default function Home() {
  const navigation = {
    goBack: () => router.back(),
    navigate: (screen: string) => router.push(screen.toLowerCase()),
    replace: (screen: string) => router.replace(screen.toLowerCase())
  };

  return <HomeScreen navigation={navigation} route={{}} />;
}