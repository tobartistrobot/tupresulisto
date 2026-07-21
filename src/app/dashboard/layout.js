/**
 * Metadata de /dashboard. Zona privada: se marca noindex para que no aparezca
 * en Google (además de estar bloqueada en robots.txt).
 */
export const metadata = {
    title: 'Mi panel',
    robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }) {
    return children;
}
