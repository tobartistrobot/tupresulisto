import { notFound } from 'next/navigation';
import { LISTA_GREMIOS, gremioPorSeoSlug } from '../../lib/gremios';
import GremioSeoPage from '../../components/gremios/GremioSeoPage';

/**
 * Ruta dinámica de las páginas SEO por gremio: /presupuestos-para-carpinteros,
 * /presupuestos-para-toldos, etc. El contenido vive en src/lib/gremios.js;
 * añadir un gremio allí crea su página aquí sin tocar nada más.
 *
 * `dynamicParams = false` limita la ruta a los slugs declarados: cualquier
 * otra URL en este segmento devuelve 404 sin ejecutar código, en vez de
 * intentar renderizar basura que llegue por la barra de direcciones.
 */
export const dynamicParams = false;

export function generateStaticParams() {
    return LISTA_GREMIOS.map(g => ({ gremioSlug: g.seoSlug }));
}

export async function generateMetadata({ params }) {
    const { gremioSlug } = await params;
    const gremio = gremioPorSeoSlug(gremioSlug);
    if (!gremio) return {};

    return {
        title: gremio.seo.title,
        description: gremio.seo.description,
        alternates: { canonical: `/${gremio.seoSlug}` },
        openGraph: {
            title: gremio.seo.title,
            description: gremio.seo.description,
            url: `/${gremio.seoSlug}`,
            type: 'website',
        },
    };
}

/** Schema FAQPage para resultados enriquecidos en Google. */
function faqJsonLd(gremio) {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: gremio.faq.map(({ p, r }) => ({
            '@type': 'Question',
            name: p,
            acceptedAnswer: { '@type': 'Answer', text: r },
        })),
    };
}

export default async function PaginaGremioSeo({ params }) {
    const { gremioSlug } = await params;
    const gremio = gremioPorSeoSlug(gremioSlug);
    if (!gremio) notFound();

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(gremio)) }}
            />
            <GremioSeoPage gremio={gremio} />
        </>
    );
}
