import { View } from 'react-native';
import { router } from 'expo-router';
import SettingScreen from '../../screens/SettingScreen';

export default function Settings() {
  const navigation = {
    goBack: () => router.back(),
    navigate: (screen: string) => router.push(screen.toLowerCase()),
    replace: (screen: string) => router.replace(screen.toLowerCase())
  };

  return <SettingScreen navigation={navigation} route={{}} />;
}