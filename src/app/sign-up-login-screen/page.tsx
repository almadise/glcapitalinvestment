import { Suspense } from 'react';
import AuthScreen from './components/AuthScreen';

export const metadata = {
  title: 'Connexion - GL Capital Investment SA',
  description: 'Accédez à votre espace client sécurisé GL Capital. Soumettez et suivez vos dossiers de financement.',
};

export default function SignUpLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-navy-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" /></div>}>
      <AuthScreen />
    </Suspense>
  );
}