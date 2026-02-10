'use client';
import LoginScreen from '../../components/LoginScreen';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();

    return (
        <LoginScreen
            onLoginSuccess={() => router.push('/dashboard')}
            onSwitchToRegister={() => router.push('/register')}
            // Mode is handled internally by LoginScreen if we fix it, or we pass prop
            mode="login"
        />
    );
}
