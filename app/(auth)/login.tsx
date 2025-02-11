import  LoginScreen from '../../screens/LoginScreen';
import { useRouter } from 'expo-router';

const LoginPage: React.FC = () => {
  const router = useRouter();
  return <LoginScreen navigation={router} />;
};

export default LoginPage;
