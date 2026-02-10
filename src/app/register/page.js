'use client';
import LoginScreen from '../../components/LoginScreen';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
    const router = useRouter();

    return (
        <LoginScreen
            onLoginSuccess={() => router.push('/dashboard')}
            onSwitchToLogin={() => router.push('/login')}
            mode="register"
        />
    );
}
