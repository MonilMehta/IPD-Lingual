import { View } from 'react-native';
import { router } from 'expo-router';
import PhraseBookScreen from '../../screens/phrasebook/PhraseBookScreen';

export default function Phrasebook() {
  const navigation = {
    goBack: () => router.back(),
    navigate: (screen: string) => router.push(screen.toLowerCase()),
    replace: (screen: string) => router.replace(screen.toLowerCase())
  };

  return <PhraseBookScreen navigation={navigation} route={{}} />;
}