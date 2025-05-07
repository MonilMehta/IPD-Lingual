import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getToken() {
  // Try to get token from AsyncStorage, fallback to hardcoded if not found
  const stored = await AsyncStorage.getItem('userToken');
  if (stored) return stored;
  // fallback (dev only)
}
