/**
 * Metadata de /contact. La página es cliente; el título lo pone este layout.
 */
export const metadata = {
    title: 'Contacto y ayuda',
    description:
        '¿Dudas con TuPresuListo? Escríbenos y te ayudamos a empezar a presupuestar desde el móvil.',
    alternates: { canonical: '/contact' },
};

export default function ContactLayout({ children }) {
    return children;
}
