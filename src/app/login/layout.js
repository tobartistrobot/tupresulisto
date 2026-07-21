/**
 * Metadata de /login. La página es cliente, así que el título lo pone este
 * layout de servidor.
 *
 * Se marca noindex: una pantalla de acceso no aporta nada en Google y solo
 * competiría con la home por las mismas búsquedas de marca.
 */
export const metadata = {
    title: 'Acceso clientes',
    description: 'Entra en tu cuenta de TuPresuListo.',
    robots: { index: false, follow: true },
};

export default function LoginLayout({ children }) {
    return children;
}
