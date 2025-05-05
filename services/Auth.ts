import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getToken() {
  // Try to get token from AsyncStorage, fallback to hardcoded if not found
  const stored = await AsyncStorage.getItem('userToken');
  if (stored) return stored;
  // fallback (dev only)
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc0NjQ1NzEyOSwianRpIjoiNDBhYTY1MjAtOWY1ZS00NTRkLThmMmUtYjlkOGY5YzM1OTQ4IiwidHlwZSI6ImFjY2VzcyIsInN1YiI6Im1vbmlsIiwibmJmIjoxNzQ2NDU3MTI5LCJjc3JmIjoiZjg4NjIxMzctZDM3Yi00YjhiLWJlNWMtNTZkMGI4Mjg4NjgxIiwiZXhwIjoxNzQ2NTQzNTI5fQ.qJ4XjZGC1WayYgzI-V25ZNGD5SWH46LJQHj4ydTvqU0';
}
