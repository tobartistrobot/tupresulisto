/**
 * Metadata de /register. La página en sí es un componente cliente y no puede
 * exportar metadata, así que la define este layout de servidor.
 *
 * Es la página de conversión, la que enlazan los anuncios: conviene que tenga
 * su propio título y descripción, y que sea indexable.
 */
export const metadata = {
    title: 'Crea tu cuenta gratis',
    description:
        'Empieza a presupuestar en minutos. Sin tarjeta y con un catálogo de tu gremio ya preparado.',
    alternates: { canonical: '/register' },
};

export default function RegisterLayout({ children }) {
    return children;
}
