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
- **Lemon Squeezy** para pagos (webhook en `/api/webhooks/lemon`, con firma verificada), **PostHog** analítica, despliegue en **Vercel** (los merges a `main` despliegan solos)
- **Gemini** (REST, sin SDK) para el agente IA

La app vive en `src/components/v30/`. `AppV30.js` orquesta las vistas (dashboard, quote, prods, clients, config). Hay componentes antiguos fuera de `v30/` que ya no se usan; no los tomes como referencia.

## Arquitectura de datos (Firestore)

Por usuario (`users/{uid}`):

- **Documento raíz**: perfil + facturación (campos protegidos por reglas) + **productos y categorías**. ⚠️ Los productos llevan la imagen en base64 dentro del propio doc: es la misma bomba del límite de 1 MB que ya explotó con el historial. Migrarlos a subcolección es la deuda técnica número 1.
- **`quotes/{id}`**: un documento por presupuesto (id = timestamp). El guardado escribe SOLO los que cambian (diff por huella JSON en `useSyncEngine`), y un `onSnapshot` sobre la colección refleja en tiempo real lo que escriban agentes u otros dispositivos.
- **`trash/{deletedAt}`**: papelera, mismo esquema de diffs.
- **`clients/{clave}`**: fichas de cliente CON VIDA PROPIA (no se deducen del historial; borrar el último presupuesto no borra la ficha). La identidad es nombre+teléfono, centralizada en `src/utils/clientKey.js` — no inventes otra.
- **`data/config`**: configuración. Todo campo que edite `SysConfig` debe tener valor inicial en `useSyncEngine` (input `undefined` = no controlado para React).
- **`data/history`**: el documento ÚNICO legacy, congelado como copia de seguridad tras la migración (marca `migratedToSubcollection` + `migratedAt` + censo `legacyResolvedIds`). No escribir en él; la app "adopta" una sola vez los presupuestos que escritores antiguos dejen ahí (censados para no resucitar lo borrado).
- **`data/agentUsage`**: tope diario del chat del agente.

`api_keys` (colección raíz): claves `tpl_...` de agentes, docId = SHA-256 de la clave. Las reglas de Firestore niegan por defecto todo lo no listado; el Admin SDK las salta (por eso las rutas de API DEBEN autenticar por su cuenta).

El marshal/unmarshal de Firestore (arrays anidados prohibidos) vive en `src/lib/firestoreMarshal.js`, compartido entre app y servidor.

## Agentes de IA (dos puertas, un cerebro)

- **MCP** (`/api/mcp`, código en `src/app/api/[transport]/route.js`): para agentes externos, Bearer `tpl_...`. 6 herramientas.
- **Chat en la app** (`/api/agent/chat` + `AgentChat.js`): función PRO con dictado por voz (Web Speech API es-ES; en iOS Safari no existe y el botón se oculta). Autentica con el ID token de Firebase.
- **Ambos comparten `src/lib/agentQuoting.js`** (resolución de productos/extras, cálculo de líneas y totales sobre `pricingEngine.js`). Si tocas la lógica de precios, tócala AHÍ, nunca en una de las dos puertas.
- Filosofía fase 1: el agente prepara, el humano aprueba y envía. `calcular_precio` NO persiste (para tanteos); `crear_presupuesto` sí.
- Regla de oro heredada del agente de Telegram que hubo que matar en mayo: **el uid sale SIEMPRE del token verificado, jamás del cuerpo de la petición**.

## Variables de entorno

| Variable | Dónde | Nota |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | .env.local + Vercel | Config pública del cliente |
| `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PROJECT_ID` | **SOLO Vercel** | Admin SDK. En local NO están → las rutas que lo usan dan 503; se prueban en producción |
| `GEMINI_API_KEY` | Vercel | **Nivel de pago obligatorio** (el gratuito entrena con los datos → RGPD). `GEMINI_MODEL` opcional (por defecto `gemini-flash-latest`) |
| `LEMONSQUEEZY_WEBHOOK_SECRET`, `COUPON_CODES`, `ADMIN_EMAILS` | Vercel | Pagos, cupones, admins extra |

Al borrar código que usaba credenciales, **revocar la credencial además** (lección de las variables huérfanas del bot de Telegram).

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

Cada superficie con `bg-*` necesita su `dark:bg-*`, y cada texto su `dark:text-*`. Cuando falta uno de los dos aparece el fallo clásico de este proyecto: **texto blanco sobre fondo blanco**. Si tocas un componente, comprueba también el contenedor que lo envuelve.

Para comprobarlo rápido: `document.documentElement.classList.toggle('dark')`.

### `h-full` en paneles flex hermanos: casi siempre es un error

Lo correcto es `flex-1 min-h-0`. Sin el `min-h-0`, un elemento flex se niega a encogerse por debajo de su contenido y el desbordamiento vuelve.

### Pies de página fijos: que solo lleven acciones

El contenido variable va en la zona con scroll; en el pie fijo, solo botones. Margen inferior con notch: `pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]`.

### Secciones plegables

Cuando pliegues algo que el usuario ha rellenado, **deja siempre un resumen visible**.

### Maestro-detalle en móvil: toda pantalla necesita salida

Si la lista se oculta al seleccionar un elemento, el detalle DEBE tener vuelta atrás **en todos sus estados, incluido el vacío** — y si el elemento seleccionado deja de existir, se vuelve a la lista solo (`ClientManager` ya lo hace; imítalo).

## Trampas conocidas

### `confirm()` / `alert()` nativos: prohibidos

En la PWA instalada el navegador puede ignorarlos EN SILENCIO: la función devuelve false y el botón "no hace nada". Usa `useConfirm()` de `src/context/ConfirmContext.js` (devuelve promesa, explica consecuencias) y `useToast()` para avisos.

### Checkbox `sr-only` en interruptores: nunca

`sr-only` deja el input absoluto y de 1×1 px; al pulsar la etiqueta el navegador lo enfoca y hace scroll hasta él — y si un ancestro tiene `overflow-hidden` (como el `<main>` de la app), desplaza el contenido fuera de la vista sin vuelta atrás ("la pestaña se pone en negro"). El input debe OCUPAR el sitio del control con `opacity-0` (ver el interruptor de `SysConfig`).

### La regla global de área táctil vive en `@layer base`

`button, a { min-height: 44px }` está en `@layer base` A PROPÓSITO: fuera de capas, lo no-capado gana a cualquier utilidad de Tailwind (que viven en `@layer utilities`) sin mirar especificidad, y anulaba todos los `min-h-*` de botones en silencio. Si añades CSS global, dentro de una capa.

### `useRef(true)` + cleanup = bomba con StrictMode

Un ref `isMounted` que el cleanup pone a `false` debe volver a `true` DENTRO del efecto: en desarrollo React monta→desmonta→remonta y si solo se inicializa en el `useRef` queda `false` para siempre (el botón Guardar se quedó "Guardando..." por esto).

### Estado deducido: registra la intención

"No está en X" no distingue "nunca llegó" de "lo borraron a propósito" — deducirlo resucitó presupuestos borrados. Si una migración/sincronización decide por ausencia, guarda un censo explícito de lo ya resuelto. Y al arreglar lógica de estado, cubre TODOS los estados, no solo el que viste fallar.

### `html2canvas-pro`, nunca `html2canvas`

Tailwind v4 define su paleta en `oklch()` y el compilador de Next la emite como `lab()` (medido: 0 `oklch` y 116 `lab(` en el CSS final; el `getComputedStyle` del navegador también devuelve `lab(...)`). Cualquiera de los dos espacios modernos revienta al `html2canvas` clásico, que no sabe parsearlos. Vale para toda librería que lea colores computados del DOM: compruébalo antes de instalarla.

### El service worker solo se registra en producción

Para probar PWA/offline: build de producción (config `prod` de `.claude/launch.json`, puerto 3001). Si cambias el cascarón, sube la versión de caché en `public/sw.js` (`tupresulisto-vN`) para que los clientes instalados se actualicen pronto.

### Firestore ya guarda datos sin conexión

`initializeFirestore` con caché persistente y try/catch a propósito (HMR). No lo "simplifiques".

### Datos del usuario: nunca confíes en el cuerpo de la petición

Verificar el ID token y usar el uid del token. Admins centralizados en `src/lib/adminEmails.js`.

## Flujo de trabajo que funciona aquí

- **Páginas sonda**: para verificar componentes que viven tras el login, crea `src/app/probe-X/page.js` montándolos con datos falsos, verifica con el navegador (medidas del DOM, no capturas) y BÓRRALA antes de commitear. Ojo: las carpetas `_privadas` de Next no generan ruta.
- **PowerShell rompe las comillas** en argumentos multilínea a git/gh: mensajes de commit con `git commit -F fichero` y cuerpos de PR con `--body-file`.
- **Verificar despliegues de Vercel**: `vercel ls` lista también despliegues VIEJOS en Ready — espera a que no quede ninguno "Building" y mira el más reciente. Para confirmar que producción sirve el código nuevo, busca un texto tuyo en los chunks JS (`/_next/static/chunks/`) del dominio real; el HTML servido no contiene lo que se renderiza tras el login.
- **Probar el agente/MCP en producción**: los clientes MCP cachean la lista de herramientas al conectar; tras añadir una herramienta hay que reconectar (chat nuevo). La nota que devuelven las herramientas sirve de "huella de versión" del servidor.

## Antes de dar algo por terminado

1. **Compila en producción** (`npm run build`). Es más estricto que el modo desarrollo.
2. **Míralo en el navegador**, a 375px y en escritorio, en claro y en oscuro.
3. **Mide, no estimes.** `getBoundingClientRect` antes que capturas. Si un comprobador contradice lo que se ve en pantalla, sospecha del comprobador — y dilo, en vez de reportar datos en los que no confías.

## Al escribir en la interfaz

Todo de cara al usuario va **en español de España**, tono directo de profesional de gremio, sin jerga. "Presupuesto", no "quote". Los textos de confirmación explican la consecuencia ("se moverá a la papelera, podrás recuperarlo"), no solo preguntan.

**El copy solo afirma lo que el producto hace HOY** — verificado contra el código, no contra el recuerdo. Ya hubo que retirar "interpola el precio" (aplica tramos), "duplicar presupuesto" (no existe) y "catálogo de ejemplo incluido" (no hay siembra). Los testimonios de las páginas de gremio son inventados y están desactivados hasta tener reales.

Los mensajes de commit también en español, describiendo **qué problema resuelve el cambio y por qué**, no solo qué se tocó.
