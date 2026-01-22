
export const getFriendlyErrorMessage = (errorCode) => {
    switch (errorCode) {
        case 'auth/invalid-email':
            return 'Esa dirección de correo no parece válida. ¿Podrías revisarla? Un presupuesto perfecto empieza por un email bien escrito.';
        case 'auth/user-not-found':
            return 'No hemos encontrado ninguna cuenta con este email. ¿Quizás usaste otro o todavía no te has registrado?';
        case 'auth/wrong-password':
            return 'Esa no es la contraseña correcta. Si se te ha olvidado, usa el enlace de recuperación y vuelve al taller en un minuto.';
        case 'auth/too-many-requests':
            return 'Demasiados intentos. Por seguridad, hemos bloqueado el acceso temporalmente. Tómate un café y vuelve a intentarlo pronto.';
        case 'auth/email-already-in-use':
            return 'Este correo ya tiene una cuenta. Intenta iniciar sesión directamente o recupera tu contraseña.';
        case 'auth/weak-password':
            return 'Tu contraseña es algo vulnerable. Necesitamos al menos 6 caracteres para mantener tu seguridad al 100%.'; // Removed $ latex formatting for plain text
        case 'auth/missing-email':
            return 'Por favor, introduce tu email para continuar.';
        case 'auth/internal-error':
            return 'Ha ocurrido un error interno. Por favor, inténtalo de nuevo más tarde.';
        case 'auth/network-request-failed':
            return 'Parece que no tienes conexión a internet. Revisa tu red e inténtalo de nuevo.';
        default:
            return 'Ha ocurrido un error inesperado al intentar acceder. Por favor, inténtalo de nuevo.';
    }
};
