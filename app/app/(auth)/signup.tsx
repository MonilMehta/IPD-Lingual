import SignupScreen from '@/screens/SignupScreen';
import { useRouter } from 'expo-router';

const SignupPage: React.FC = () => {
  const router = useRouter();
  return <SignupScreen navigation={router} />;
};

export default SignupPage;
