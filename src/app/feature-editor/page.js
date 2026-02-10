'use client';
import EditorTourPage from '../../components/EditorTourPage';
import { useRouter } from 'next/navigation';

export default function FeatureEditorPage() {
    const router = useRouter();

    return (
        <EditorTourPage
            onRegister={() => router.push('/register')}
            onBack={() => router.push('/')}
        />
    );
}
