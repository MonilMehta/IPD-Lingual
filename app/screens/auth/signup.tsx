import SignupScreen from '@/screens/SignupScreen';
import { useRouter } from 'expo-router';

export default function Login() {
    const router = useRouter();
  return <SignupScreen navigation={router} />;
}
