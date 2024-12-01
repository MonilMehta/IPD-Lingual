import { View } from 'react-native';
import { router } from 'expo-router';
import VoiceScreen from '../../screens/VoiceTranslation/VoiceScreen';

export default function VoiceTranslation() {
  const navigation = {
    goBack: () => router.back(),
    navigate: (screen: string) => router.push(screen.toLowerCase()),
    replace: (screen: string) => router.replace(screen.toLowerCase())
  };

  return <VoiceScreen navigation={navigation} route={{}} />;
}