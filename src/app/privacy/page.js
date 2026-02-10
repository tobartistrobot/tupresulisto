import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
    title: 'Política de Privacidad - TuPresuListo',
    description: 'Política de privacidad y protección de datos de TuPresuListo.',
};

export default function PrivacyPage() {
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
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2">Política de Privacidad</h1>
                    <p className="text-slate-500">Última actualización: {new Date().toLocaleDateString('es-ES')}</p>
                </div>

                <div className="prose prose-slate max-w-none space-y-12">

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">1. Responsable del Tratamiento</h2>
                        <p>
                            El responsable del tratamiento de sus datos es <strong>TuPresuListo.com</strong> (SaaS B2B).
                            <br />
                            Nuestra misión es proveer herramientas digitales para la gestión y profesionalización de talleres y negocios de carpintería.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">2. Datos que Recopilamos</h2>
                        <p className="mb-4">
                            Para prestar nuestros servicios, recopilamos y tratamos los siguientes datos personales:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-slate-700">
                            <li><strong>Datos de Identificación:</strong> Nombre, dirección de correo electrónico y foto de perfil (proporcionada por su proveedor de autenticación).</li>
                            <li><strong>Datos de Facturación:</strong> Si contrata un plan PRO, los datos de pago y facturación son procesados íntegramente por nuestro Merchant of Record, <strong>Lemon Squeezy</strong>. Nosotros no almacenamos números de tarjetas de crédito.</li>
                            <li><strong>Datos de Uso:</strong> Información sobre cómo interactúa con la aplicación (presupuestos creados, clientes guardados) para mejorar el servicio.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">3. Finalidad del Tratamiento</h2>
                        <p>
                            Sus datos se utilizan exclusivamente para:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-slate-700 mt-4">
                            <li>Proveer el servicio de gestión de presupuestos y optimización de materiales.</li>
                            <li>Gestionar el acceso a su cuenta y autenticar su identidad.</li>
                            <li>Procesar pagos y habilitar las funciones Premium correspondientes a su suscripción.</li>
                            <li>Enviar notificaciones importantes sobre el servicio o cambios en esta política.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">4. Terceros y Proveedores de Servicios</h2>
                        <p className="mb-4">
                            Para garantizar el funcionamiento de la plataforma, compartimos datos estrictamente necesarios con proveedores de confianza:
                        </p>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <h3 className="font-bold text-slate-900">Google Firebase</h3>
                                <p className="text-sm">Infraestructura de alojamiento, base de datos y servicios de autenticación segura.</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <h3 className="font-bold text-slate-900">Lemon Squeezy</h3>
                                <p className="text-sm">Procesamiento de pagos, gestión de suscripciones y facturación global.</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">5. Sus Derechos</h2>
                        <p>
                            Como usuario, tiene derecho a acceder, rectificar o solicitar la eliminación de sus datos en cualquier momento.
                            <br /><br />
                            Para ejercer estos derechos, o si tiene alguna duda sobre nuestra política de privacidad, por favor contáctenos directamente en:
                        </p>
                        <div className="mt-4 inline-block font-mono bg-blue-50 text-blue-700 px-4 py-2 rounded-lg border border-blue-100">
                            soporte@tupresulisto.com
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
