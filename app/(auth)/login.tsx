import { View } from 'react-native';
import { router } from 'expo-router';
import LoginScreen from '../../screens/LoginScreen';

export default function Login() {
  const navigation = {
    goBack: () => router.back(),
    navigate: (screen: string) => router.push(screen.toLowerCase()),
    replace: (screen: string) => router.replace(screen.toLowerCase())
  };

  return <LoginScreen navigation={navigation} />;
}