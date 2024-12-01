import { View } from 'react-native';
import { router } from 'expo-router';
import SignupScreen from '../../screens/SignupScreen';

export default function Signup() {
  const navigation = {
    goBack: () => router.back(),
    navigate: (screen: string) => router.push(screen.toLowerCase()),
  };

  return <SignupScreen navigation={navigation} />;
}