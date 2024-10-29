import { View } from 'react-native';
import { router } from 'expo-router';
import CameraScreen from '../../screens/CameraScreen';

export default function Profile() {
  const navigation = {
    goBack: () => router.back(),
    navigate: (screen: string) => router.push(screen.toLowerCase()),
    replace: (screen: string) => router.replace(screen.toLowerCase())
  };

  return <CameraScreen navigation={navigation} route={{}} />;
}