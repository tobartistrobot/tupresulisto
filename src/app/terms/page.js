import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
    title: 'Términos y Condiciones - TuPresuListo',
    description: 'Términos y condiciones de uso de TuPresuListo.',
};

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-white text-slate-800 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-medium mb-6"
                    >
                        <ArrowLeft size={20} />
                        Volver al inicio
                    </Link>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2">Términos y Condiciones</h1>
                    <p className="text-slate-500">Última actualización: {new Date().toLocaleDateString('es-ES')}</p>
                </div>

                <div className="prose prose-slate max-w-none space-y-12">

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">1. Aceptación de los Términos</h2>
                        <p>
                            Al acceder y utilizar <strong>TuPresuListo.com</strong>, usted acepta estar sujeto a estos términos y condiciones. Si no está de acuerdo con alguna parte de los términos, no podrá acceder al servicio.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">2. Descripción del Servicio</h2>
                        <p>
                            TuPresuListo es un software SaaS diseñado para facilitar la creación de presupuestos, gestión de clientes y cálculo de materiales para carpintería.
                        </p>
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
                            <p className="text-sm text-yellow-800">
                                <strong>Importante:</strong> Aunque nos esforzamos por garantizar la precisión de los cálculos, el usuario es el responsable final de revisar y validar todos los presupuestos y cantidades de material antes de su uso o envío al cliente final. TuPresuListo no se hace responsable de errores en pedidos de material o presupuestos erróneos.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">3. Suscripciones y Pagos</h2>
                        <p>
                            Nuestra gestión de pedidos y facturación es realizada por nuestro Merchant of Record, <strong>Lemon Squeezy</strong>.
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-slate-700 mt-4">
                            <li><strong>Renovación Automática:</strong> Las suscripciones (mensuales o anuales) se renuevan automáticamente al final de cada periodo de facturación, a menos que se cancelen con antelación.</li>
                            <li><strong>Impuestos:</strong> Lemon Squeezy recauda y remite los impuestos aplicables (IVA, etc.) según su ubicación.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">4. Política de Reembolso</h2>
                        <p>
                            Queremos que esté satisfecho con nuestro servicio. Debido a la naturaleza digital del producto:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-slate-700 mt-4">
                            <li>Ofrecemos una <strong>garantía de devolución de dinero de 7 días</strong> en su primera suscripción. Si el software no cumple sus expectativas, contáctenos dentro de los 7 días posteriores a la compra para un reembolso completo.</li>
                            <li>Pasados los 7 días, no se ofrecerán reembolsos por los periodos de suscripción ya pagados, aunque podrá seguir utilizando el servicio hasta el final de su ciclo de facturación.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">5. Propiedad Intelectual</h2>
                        <p>
                            El servicio y su contenido original (excluyendo el contenido proporcionado por los usuarios), características y funcionalidad son y seguirán siendo propiedad exclusiva de TuPresuListo y sus licenciantes.
                            <br /><br />
                            <strong>Sus Datos:</strong> Usted conserva todos los derechos sobre los datos, archivos y contenidos que introduzca en la aplicación (clientes, productos, precios).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">6. Cancelación</h2>
                        <p>
                            Puede cancelar su suscripción en cualquier momento desde la sección de "Configuración" de su cuenta o a través del portal de cliente de Lemon Squeezy. Tras la cancelación, su servicio continuará activo hasta el final del periodo de facturación pagado actual.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Contacte con Nosotros</h2>
                        <p>
                            Si tiene alguna pregunta sobre estos Términos, por favor contáctenos en:
                        </p>
                        <div className="mt-4 inline-block font-mono bg-blue-50 text-blue-700 px-4 py-2 rounded-lg border border-blue-100">
                            contacto@tupresulisto.com
                        </div>
                    </section>

                </div>

                <div className="mt-16 pt-8 border-t border-slate-200 text-center">
                    <Link
                        href="/"
                        className="text-slate-400 hover:text-slate-600 transition-colors text-sm font-semibold"
                    >
                        ← Volver a TuPresuListo
                    </Link>
                </div>
            </div>
        </div>
    );
}
