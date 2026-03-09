---
name: rastreador-de-skills
description: "Actúa como un consultor experto en habilidades agenticas (skills). Úsame cuando el usuario quiera saber qué skill aplicar para una tarea, situación o cambio concreto; cuando quiera explorar el catálogo de skills disponibles en el repositorio sickn33/antigravity-awesome-skills (1,206+ skills); cuando quiera instalar nuevas skills; o cuando quiera comparar las skills ya instaladas localmente con las disponibles en GitHub. Palabras clave: recomendar skill, qué skill usar, buscar skill, catálogo de habilidades, mejores skills para, instalar skills, explorar habilidades."
---

# 🔍 Rastreador y Recomendador de Skills

Esta habilidad convierte al agente en un consultor inteligente de skills. Analiza el contexto del usuario, consulta el catálogo oficial de GitHub y recomienda las mejores opciones para cada situación concreta.

---

## 1. Recursos Clave del Repositorio

| Recurso | URL | Uso |
|---|---|---|
| Catálogo completo | `https://raw.githubusercontent.com/sickn33/antigravity-awesome-skills/main/CATALOG.md` | Lista de todas las skills |
| Índice JSON | `https://raw.githubusercontent.com/sickn33/antigravity-awesome-skills/main/skills_index.json` | Metadatos estructurados |
| Bundles por rol | `https://github.com/sickn33/antigravity-awesome-skills/blob/main/docs/users/bundles.md` | Skills agrupadas por tipo de trabajo |
| Workflows | `https://github.com/sickn33/antigravity-awesome-skills/blob/main/docs/users/workflows.md` | Playbooks paso a paso |
| Web App | `https://github.com/sickn33/antigravity-awesome-skills/tree/main/apps/web-app` | Navegador interactivo |

---

## 2. Flujo de Trabajo Principal

Cuando el usuario pide una recomendación de skill, sigue estos pasos **en orden**:

### Paso 1: Clasificar la situación del usuario

Identifica el tipo de tarea. Usa este árbol de decisión:

```
¿Es una tarea de...?
├── Planificación / Ideación → @brainstorming, @architecture, @product-thinking
├── Frontend / UI / Diseño → @frontend-design, @ui-polish, @accessibility-auditor
├── Backend / API → @api-design-principles, @rest-api, @graphql-design
├── Seguridad → @security-auditor, @owasp-top10, @auth-review
├── Calidad / Testing → @test-driven-development, @unit-testing, @lint-and-validate
├── Documentación → @doc-coauthoring, @readme-writer, @changelog-writer
├── DevOps / Despliegue → @ci-cd-pipeline, @docker-compose, @vercel-deploy
├── Debugging → @debugging-strategies, @root-cause-analysis
├── Rendimiento → @performance-audit, @bundle-analysis
├── Base de datos → @database-design, @schema-migration
├── Git / PR → @create-pr, @commit-message, @code-review
└── IA / Prompts → @prompt-engineering, @llm-integration
```

### Paso 2: Inventariar las skills locales ya instaladas

Ejecuta mentalmente un listado de `.agent/skills/` del proyecto actual para saber qué ya está disponible y no recomendar instalar lo que ya existe.

**Skills locales del proyecto `tupresulisto` (instaladas):**
- `analista-seguridad-firebase` → Seguridad Firestore/Auth
- `arquitecto-codigo-limpio` → Refactor React/SOLID
- `auditor-accesibilidad-ui` → Accesibilidad / ARIA
- `creador-de-habilidades` → Crear nuevas skills
- `experto-diseno-web` → Diseño UI/UX / Arte
- `experto-interfaces-modernas` → UI multidispositivo premium
- `experto-modo-oscuro` → Dark/Light mode theming
- `experto-testing-react` → Tests unitarios/e2e React
- `gestor-suscripciones-saas` → Lemon Squeezy / Stripe
- `maestro-despliegues-vercel` → CI/CD Vercel
- `optimizador-rendimiento-web` → Core Web Vitals
- `rastreador-de-skills` → Esta misma skill ✅

### Paso 3: Consultar el catálogo de GitHub si no hay coincidencia local

Si la situación no está cubierta por ninguna skill local, usa `read_url_content` para consultar el CATALOG.md:

```
URL: https://raw.githubusercontent.com/sickn33/antigravity-awesome-skills/main/CATALOG.md
```

Busca con `grep_search` o filtra por palabras clave relevantes de la situación del usuario.

### Paso 4: Presentar la recomendación estructurada

Presenta siempre la respuesta con este formato:

```markdown
## 🎯 Skills Recomendadas para: [descripción de la situación]

### ✅ Ya tienes instaladas:
| Skill | Cómo usarla |
|---|---|
| `nombre-skill` | "Usa @nombre-skill para..." |

### 📦 Recomendadas para instalar desde GitHub:
| Skill | Por qué | Cómo instalar |
|---|---|---|
| `@nombre-skill` | Explicación breve | `npx antigravity-awesome-skills --gemini` y luego copiar de `~/.gemini/antigravity/skills/` |

### 🚀 Combinación óptima sugerida:
1. Primero: usa `@skill-A` para X
2. Luego: usa `@skill-B` para Y
3. Finalmente: valida con `@skill-C`
```

---

## 3. Categorías de Skills del Repositorio (Top)

Estas son las 10 skills más versátiles del repositorio oficial, útiles como punto de partida:

| Skill | Cuándo usarla |
|---|---|
| `@brainstorming` | Planear cualquier feature, MVP o arquitectura |
| `@architecture` | Diseñar sistemas o componentes complejos |
| `@test-driven-development` | Implementar con pruebas desde el inicio |
| `@doc-coauthoring` | Escribir documentación estructurada |
| `@lint-and-validate` | Verificar calidad de código antes de commit |
| `@create-pr` | Empaquetar trabajo en un Pull Request limpio |
| `@debugging-strategies` | Resolver bugs de forma sistemática |
| `@api-design-principles` | Diseñar o revisar la forma de una API |
| `@frontend-design` | Mejorar calidad UI e interacciones |
| `@security-auditor` | Revisar seguridad en endpoints o auth |

---

## 4. Cómo Instalar Skills Nuevas

### Instalación global (todas las skills del repo):
```powershell
npx antigravity-awesome-skills --gemini
# Se instalan en: C:\Users\<USUARIO>\.gemini\antigravity\skills\
```

### Instalación en el proyecto actual:
```powershell
npx antigravity-awesome-skills --path C:\Users\USER\tupresulisto\.agent\skills
```

### Si hay error 404:
```powershell
npx github:sickn33/antigravity-awesome-skills --gemini
```

---

## 5. Reglas de Recomendación

- **Prioriza siempre** las skills ya instaladas localmente antes de sugerir instalar nuevas.
- **No recomiendas más de 3 skills** por situación, para no abrumar al usuario.
- **Combina skills** cuando la tarea involucra múltiples dominios (ej: nueva feature = @brainstorming + @architecture + @test-driven-development).
- **Explica siempre el "por qué"** de cada recomendación con una frase concisa.
- Si el usuario describe una tarea ambigua, **haz 1 pregunta de clarificación** antes de recomendar.
- Cuando hay una skill local equivalente a una del repo, **usa la local** a menos que la del repo sea notablemente más específica.

---

## 6. Casos de Uso Frecuentes en Este Proyecto

Dado que este proyecto es una SaaS con React/Next.js + Firebase + Vercel, estas combinaciones son especialmente relevantes:

| Situación | Skills Recomendadas |
|---|---|
| Nueva pantalla o componente UI | `experto-interfaces-modernas` + `auditor-accesibilidad-ui` |
| Cambio en reglas de seguridad Firestore | `analista-seguridad-firebase` |
| Refactor de lógica de negocio | `arquitecto-codigo-limpio` + `experto-testing-react` |
| Problema de rendimiento | `optimizador-rendimiento-web` |
| Revisar antes de un deploy | `maestro-despliegues-vercel` + `analista-seguridad-firebase` |
| Nuevo plan de suscripción / pago | `gestor-suscripciones-saas` |
| Implementar dark/light mode | `experto-modo-oscuro` |
| Bug desconocido | `@debugging-strategies` (instalar desde repo) |
| Diseño de nueva feature desde cero | `@brainstorming` + `@architecture` (instalar desde repo) |
