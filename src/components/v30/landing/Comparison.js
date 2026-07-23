import React from 'react';
import { Check, X, Minus } from 'lucide-react';

/**
 * Comparativa por MÉTODOS DE TRABAJO, no contra productos con nombre.
 *
 * Dos motivos, y conviene no perderlos de vista si alguien quiere "afinarla":
 *  1. Legal: comparar con marcas concretas solo es defendible con hechos
 *     objetivos y verificables. Un juicio de valor sobre un competidor
 *     ("es lento y complejo") es terreno de competencia desleal.
 *  2. Estratégico: el rival real del autónomo es el papel y el Excel, no
 *     otro software. Nombrar competidores le descubre alternativas que
 *     probablemente no conocía.
 *
 * La columna "Otros programas" usa "a veces" con generosidad a propósito:
 * es una categoría amplia y no todos son iguales. La fuerza de la tabla no
 * está en pintar mal al resto, sino en ser la única columna entera en verde.
 * Por lo mismo, papel y Excel ganan algunas filas: una comparativa donde
 * ganamos TODO no se cree.
 */

const SI = 'si';
const NO = 'no';
const AVECES = 'aveces';

const COLUMNAS = ['Papel y boli', 'Excel', 'Otros programas', 'TuPresuListo'];

const FILAS = [
    { criterio: 'Calcula el precio con tu tarifa', valores: [NO, SI, SI, SI] },
    { criterio: 'Cómodo y rápido desde el móvil', valores: [NO, NO, AVECES, SI] },
    { criterio: 'Presupuesto formal en casa del cliente', valores: [NO, NO, AVECES, SI] },
    { criterio: 'PDF con tu logo y tus condiciones', valores: [NO, AVECES, SI, SI] },
    { criterio: 'Enviar por WhatsApp en el momento', valores: [NO, NO, AVECES, SI] },
    { criterio: 'Funciona sin cobertura', valores: [SI, AVECES, AVECES, SI] },
    { criterio: 'Se aprende en una tarde', valores: [SI, NO, NO, SI] },
];

const PRECIOS = ['Gratis', 'Gratis', 'Suele ser de pago', 'Gratis o 9,99 €'];

const Marca = ({ valor }) => {
    if (valor === SI) return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400" role="img" aria-label="Sí">
            <Check size={16} strokeWidth={3} />
        </span>
    );
    if (valor === AVECES) return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400" role="img" aria-label="A veces">
            <Minus size={16} strokeWidth={3} />
        </span>
    );
    return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700/60 text-slate-400 dark:text-slate-500" role="img" aria-label="No">
            <X size={16} strokeWidth={3} />
        </span>
    );
};

/**
 * @param {object} props
 * @param {string} [props.titulo] - Encabezado; las páginas de gremio lo
 *   personalizan con el oficio.
 * @param {string} [props.claseSeccion] - Fondo/espaciado, para alternar con
 *   las secciones vecinas de cada página.
 * @param {boolean} [props.compacto] - Tipografía y márgenes reducidos para
 *   las páginas de gremio, donde la tabla es apoyo y no protagonista.
 * @param {string} [props.claseFondoSticky] - Fondo de la columna fija. TIENE
 *   que ser el mismo color que la sección: es opaco para tapar las columnas
 *   que pasan por debajo al desplazar, y si no coincide se ve un escalón.
 */
const Comparison = ({
    titulo = 'Comparado con lo que haces ahora',
    claseSeccion = 'py-24 bg-surface dark:bg-slate-950 border-y border-slate-200 dark:border-slate-800',
    compacto = false,
    claseFondoSticky = 'bg-surface dark:bg-slate-950',
}) => {
    // Clases de la columna destacada (la nuestra), repetidas en cabecera,
    // celdas y pie para que se lea como una columna continua.
    const destacada = 'bg-blue-50/70 dark:bg-blue-500/10';

    return (
        <section id="comparativa" className={`px-4 transition-colors ${claseSeccion}`}>
            <div className={compacto ? 'max-w-4xl mx-auto' : 'max-w-5xl mx-auto'}>
                <div className={`text-center ${compacto ? 'mb-8 sm:mb-10' : 'mb-12'}`}>
                    <span className="text-blue-600 dark:text-blue-400 font-bold tracking-widest uppercase text-xs">Cómo se presupuesta hoy</span>
                    <h2 className={`font-black text-slate-900 dark:text-white leading-tight ${compacto ? 'text-3xl sm:text-4xl mt-3' : 'text-4xl md:text-5xl mt-4 mb-6'}`}>
                        {titulo}
                    </h2>
                    <p className={`text-slate-500 dark:text-slate-400 max-w-2xl mx-auto ${compacto ? 'text-base mt-4' : 'text-lg'}`}>
                        El papel es rápido pero no cierra ventas. El Excel calcula pero se queda en la oficina.
                        Los programas del sector son potentes y están pensados para el ordenador de la mesa.
                    </p>
                </div>

                {/* La tabla es ancha: scrollea DENTRO de su caja, nunca la página.
                    La primera columna queda fija para no perder el criterio al desplazar. */}
                <div className="overflow-x-auto -mx-4 px-4 pb-2">
                    <table className="w-full min-w-[560px] border-separate border-spacing-0">
                        <caption className="sr-only">
                            Comparativa de formas de presupuestar: papel y boli, Excel, otros programas y TuPresuListo
                        </caption>
                        <thead>
                            <tr>
                                <th scope="col" className={`sticky left-0 z-10 ${claseFondoSticky} text-left p-3 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500`}>
                                    <span className="sr-only">Criterio</span>
                                </th>
                                {COLUMNAS.map((col, i) => {
                                    const esNuestra = i === COLUMNAS.length - 1;
                                    return (
                                        <th
                                            key={col}
                                            scope="col"
                                            className={`p-3 text-center align-bottom ${esNuestra ? `${destacada} rounded-t-2xl` : ''}`}
                                        >
                                            <span className={`block text-sm font-black leading-tight ${esNuestra ? 'text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-300'}`}>
                                                {col}
                                            </span>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {FILAS.map((fila, idx) => (
                                <tr key={fila.criterio} className="group">
                                    <th
                                        scope="row"
                                        className={`sticky left-0 z-10 ${claseFondoSticky} text-left p-3 pr-4 text-sm font-bold text-slate-700 dark:text-slate-200 ${idx !== 0 ? 'border-t border-slate-200 dark:border-slate-800' : ''}`}
                                    >
                                        {fila.criterio}
                                    </th>
                                    {fila.valores.map((valor, i) => {
                                        const esNuestra = i === fila.valores.length - 1;
                                        return (
                                            <td
                                                key={i}
                                                className={`p-3 text-center ${esNuestra ? destacada : ''} ${idx !== 0 ? 'border-t border-slate-200 dark:border-slate-800' : ''}`}
                                            >
                                                <Marca valor={valor} />
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                            <tr>
                                <th scope="row" className={`sticky left-0 z-10 ${claseFondoSticky} text-left p-3 pr-4 text-sm font-bold text-slate-700 dark:text-slate-200 border-t border-slate-200 dark:border-slate-800`}>
                                    Precio
                                </th>
                                {PRECIOS.map((precio, i) => {
                                    const esNuestra = i === PRECIOS.length - 1;
                                    return (
                                        <td
                                            key={i}
                                            className={`p-3 text-center text-sm font-bold border-t border-slate-200 dark:border-slate-800 ${esNuestra ? `${destacada} rounded-b-2xl text-blue-700 dark:text-blue-300` : 'text-slate-500 dark:text-slate-400'}`}
                                        >
                                            {precio}
                                        </td>
                                    );
                                })}
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Leyenda + matiz honesto: "otros programas" es una categoría
                    amplia y no todos funcionan igual. Decirlo resta poco y suma
                    credibilidad, que es justo lo que vende una comparativa. */}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-2"><Marca valor={SI} /> Sí</span>
                    <span className="inline-flex items-center gap-2"><Marca valor={AVECES} /> Según cuál</span>
                    <span className="inline-flex items-center gap-2"><Marca valor={NO} /> No</span>
                </div>
                <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500 max-w-2xl mx-auto">
                    Comparativa por formas de trabajar, no contra ningún producto concreto.
                    Los programas del sector son muy distintos entre sí: comprueba siempre qué ofrece el tuyo.
                </p>
            </div>
        </section>
    );
};

export default Comparison;
