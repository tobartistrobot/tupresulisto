import { notFound } from 'next/navigation';
import { LISTA_GREMIOS, gremioPorSlug } from '../../../lib/gremios';
import GremioAdsPage from '../../../components/gremios/GremioAdsPage';

/**
 * Ruta dinámica de las páginas de campaña por gremio: /lp/carpinteria, etc.
 *
 * Van con noindex/nofollow a propósito: su copy se parece al de la versión
 * SEO del mismo gremio y, si Google las indexara, competirían entre sí
 * (canibalización) o contarían como contenido duplicado. Estas URLs solo se
 * usan como destino de anuncios; tampoco van en el sitemap.
 */
export const dynamicParams = false;

export function generateStaticParams() {
    return LISTA_GREMIOS.map(g => ({ gremio: g.slug }));
}

export async function generateMetadata({ params }) {
    const { gremio: slug } = await params;
    const gremio = gremioPorSlug(slug);
    if (!gremio) return {};

    return {
        title: gremio.ads.titular,
        description: gremio.ads.subtitulo,
        robots: { index: false, follow: false },
    };
}

export default async function PaginaGremioAds({ params }) {
    const { gremio: slug } = await params;
    const gremio = gremioPorSlug(slug);
    if (!gremio) notFound();

    return <GremioAdsPage gremio={gremio} />;
}
