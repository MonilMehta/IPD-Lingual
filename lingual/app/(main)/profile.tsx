import { View } from 'react-native';
import { router } from 'expo-router';
import ProfileScreen from '../../screens/ProfileScreen';

export default function Profile() {
  const navigation = {
    goBack: () => router.back(),
    navigate: (screen: string) => router.push(screen.toLowerCase()),
    replace: (screen: string) => router.replace(screen.toLowerCase())
  };

  return <ProfileScreen navigation={navigation} route={{}} />;
}