---
name: tupresulisto
description: Convenciones, arquitectura y trampas conocidas del proyecto TuPresuListo (SaaS de presupuestos para gremios, Next.js 16 + Tailwind v4 + Firebase). Úsala siempre que trabajes en este repositorio — al tocar componentes de la app o de la landing, al añadir dependencias, al depurar estilos o modo oscuro, al preparar un despliegue, o antes de dar por terminado cualquier cambio. Contiene decisiones de producto y errores ya cometidos que no conviene repetir.
---

# TuPresuListo

SaaS de presupuestos para gremios: carpintería, cristalería, toldos, aluminio y PVC.

## La misión decide las prioridades

El producto existe para que **un autónomo cierre la venta en casa del cliente, sin volver a la oficina**. El camino crítico es:

> llegar → medir → presupuestar → **entregar el presupuesto al cliente**

Ese último paso es el que da sentido a todo lo demás. Cuando dudes entre dos opciones de diseño, gana la que acorta ese camino desde un teléfono.

De ahí se derivan dos consecuencias que conviene tener presentes:

- **El móvil no es una adaptación, es el escenario principal.** El usuario está de pie en un salón ajeno con una mano ocupada. Nada de lo importante debería requerir scroll ni precisión de ratón.
- **Entregar significa entregar de verdad**, no "generar un PDF". Si el usuario tiene que salir de la app, buscar un archivo y adjuntarlo a mano, el producto ha fallado en su propósito aunque el PDF sea precioso.

## Dos proyectos, no mezclar

Existe un proyecto hermano para automatizar **GOVA Ventanas** (el negocio familiar del autor). **Este repositorio es solo el producto vendible.**

No introduzcas aquí particularidades de GOVA — sus proveedores, sus flujos o sus manías. Lo que sirve a un solo negocio hace el producto más difícil de vender al resto. Si algo huele a "esto solo lo necesita GOVA", va en el otro proyecto, que consume a este.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19**
- **Tailwind v4** — configurado en `src/app/globals.css` con `@theme`, y modo oscuro por clase vía `@custom-variant dark`
- **Firebase** Auth + Firestore (cliente) y Admin SDK en las rutas de API
- **Lemon Squeezy** para pagos (webhooks), **PostHog** analítica, despliegue en **Vercel**

La app vive en `src/components/v30/`. `AppV30.js` orquesta las vistas (dashboard, quote, prods, clients, config). Hay componentes antiguos fuera de `v30/` que ya no se usan; no los tomes como referencia.

## Reglas de interfaz

### Verifica en 375px, siempre

No basta con que el código parezca correcto: abre el navegador a 375×812 y míralo. Los fallos de este proyecto han sido casi todos de espacio vertical, y no se ven leyendo JSX.

Un comprobador útil, más fiable que juzgar a ojo desde una captura:

```js
// Desbordamiento horizontal (no debería haber ninguno)
document.documentElement.scrollWidth > document.documentElement.clientWidth

// ¿Un botón queda tapado por la barra inferior?
const b = /* el botón */.getBoundingClientRect();
const nav = document.querySelector('[class*="fixed bottom-0"]').getBoundingClientRect();
b.bottom > nav.top  // true = está tapado
```

### Claro y oscuro, ambos

Cada superficie con `bg-*` necesita su `dark:bg-*`, y cada texto su `dark:text-*`. Cuando falta uno de los dos aparece el fallo clásico de este proyecto: **texto blanco sobre fondo blanco**.

Ya ha pasado dos veces —en los modales del panel y en la landing entera— y en ambos casos el origen fue el mismo: un componente adaptado a medias mientras sus vecinos no. Si tocas un componente, comprueba también el contenedor que lo envuelve.

Para comprobarlo rápido sin cambiar la configuración del sistema:

```js
document.documentElement.classList.toggle('dark')
```

### `h-full` en paneles flex hermanos: casi siempre es un error

Si un panel comparte espacio vertical con otro elemento (una barra de pestañas, una cabecera), `h-full` le hace reclamar el 100% del contenedor **ignorando a su hermano**, y se desborda por abajo.

Lo correcto es `flex-1 min-h-0`. El `min-h-0` es la parte que casi nadie recuerda: sin él, un elemento flex se niega a encogerse por debajo de su contenido y el desbordamiento vuelve.

### Pies de página fijos: que solo lleven acciones

Las barras inferiores de acciones crecen sin control cuando se les mete contenido variable (resúmenes, totales, campos plegables). Ese contenido va en la zona con scroll; en el pie fijo, solo los botones. Así no puede volver a tapar nada.

Para el margen inferior en móviles con notch, `pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]` — con `max`, no sumando, para no acumular espacio de más.

### Secciones plegables

Cuando pliegues algo que el usuario ha rellenado, **deja siempre un resumen visible** (el nombre del cliente, un badge con el descuento). Esconder información sin rastro hace que se olvide que está puesta.

## Trampas conocidas

### `html2canvas-pro`, nunca `html2canvas`

Tailwind v4 genera los colores en `oklch()`. El `html2canvas` clásico no sabe interpretar ese formato y **falla al generar el PDF**. Usa siempre `html2canvas-pro`, que sí lo soporta.

Vale para cualquier librería que tenga que leer colores calculados del DOM: compruébalo antes de instalarla.

### El service worker solo se registra en producción

`src/components/ServiceWorkerRegister.js` no hace nada en desarrollo, a propósito: serviría código cacheado y rompería el refresco en caliente. Para probar la PWA o el modo sin conexión hace falta un build de producción — hay una configuración `prod` en `.claude/launch.json` que lo levanta en el puerto 3001.

Si cambias el cascarón de la app y necesitas que los usuarios existentes recojan la versión nueva, sube la versión de la caché (`tupresulisto-v1` → `-v2`) en `public/sw.js`.

### Firestore ya guarda datos sin conexión

`src/lib/firebase.js` inicializa Firestore con caché persistente en IndexedDB, porque el autónomo puede estar en un sótano sin cobertura. Se usa `initializeFirestore` (no `getFirestore`) y hay un `try/catch` a propósito: con el refresco en caliente puede intentar inicializarse dos veces.

### Datos del usuario: nunca confíes en el cuerpo de la petición

Las rutas de API deben verificar el ID token de Firebase y usar **el uid del token**, no un id que venga en el cuerpo. Ya hubo un fallo así en `redeem-coupon`: aceptaba cualquier `userId` y permitía canjear cupones sobre cuentas ajenas.

Los emails con permisos de administración están centralizados en `src/lib/adminEmails.js` (`isAdminEmail()`), ampliables con la variable de entorno `ADMIN_EMAILS`. No los repitas por las rutas.

## Antes de dar algo por terminado

1. **Compila en producción** (`npm run build`). Es más estricto que el modo desarrollo y ha cazado errores de JSX que el servidor de desarrollo dejaba pasar.
2. **Míralo en el navegador**, a 375px y en escritorio, en claro y en oscuro.
3. **Mide, no estimes.** Cuando el problema sea de espacio o de solapamiento, saca números del DOM (`getBoundingClientRect`) en vez de juzgar por una captura. Las capturas del panel se quedan congeladas a veces y llevan a conclusiones falsas.

Si un comprobador automático da un resultado que contradice lo que se ve claramente en pantalla, sospecha del comprobador antes que de la pantalla — y dilo, en vez de reportar datos en los que no confías.

## Al escribir en la interfaz

Todo de cara al usuario va **en español de España**, con el tono de alguien que habla con un profesional de gremio: directo y sin jerga técnica. "Presupuesto", no "quote". "Enviar al cliente", no "compartir documento".

Los mensajes de commit también en español, describiendo **qué problema resuelve el cambio y por qué**, no solo qué se tocó.
