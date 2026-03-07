---
name: creador-de-habilidades
description: "Úsame cuando necesites crear o configurar nuevas habilidades (skills) para tu sistema de agentes. Esta habilidad contiene las reglas de formato, estructura de carpetas y mejores prácticas para crear un manual de instrucciones efectivo que otras instancias de IA puedan entender."
---

# Creador de Habilidades (Skill Creator)

Esta habilidad te proporciona el conocimiento y los pasos necesarios para crear nuevas habilidades que amplíen tus propias capacidades.

## 1. ¿Qué es una Habilidad (Skill)?
Una habilidad es una carpeta que contiene instrucciones específicas (`SKILL.md`), scripts y recursos que te enseñan cómo realizar una tarea especializada o seguir los estándares de un proyecto.

## 2. ¿Dónde se guardan las habilidades?
Existen dos niveles principales dependiendo de si la habilidad es solo para este proyecto o para todos:

- **Locales del Proyecto (Recomendado):** `<directorio_del_proyecto>/.agent/skills/<nombre-de-la-habilidad>/`
- **Globales:** `~/.gemini/antigravity/skills/<nombre-de-la-habilidad>/`

## 3. Estructura de Archivos Requerida
Toda habilidad debe tener al menos su propio directorio y el archivo `SKILL.md` principal.

```text
.agent/skills/nombre-de-la-nueva-habilidad/
├─── SKILL.md       # (OBLIGATORIO) Instrucciones principales.
├─── scripts/       # (Opcional) Scripts de ayuda (.py, .sh, etc.)
├─── examples/      # (Opcional) Implementaciones de referencia
└─── recursos/      # (Opcional) Plantillas u otros documentos útiles
```

## 4. Estructura de SKILL.md
El archivo \`SKILL.md\` debe estar escrito en formato Markdown y **OBLIGATORIAMENTE** comenzar con un bloque YAML llamado "frontmatter" delimitado por tres guiones (`---`).

```markdown
---
name: nombre-de-la-habilidad
description: "Describe claramente en tercera persona en qué consiste esta habilidad y cuándo la IA debería activarla. Usa palabras clave relevantes."
---

# Nombre Legible de la Habilidad
Aquí comienzan las instrucciones...
```

### Reglas del Frontmatter
- `name`: Identificador único y corto (ej. `gestor-base-datos`). Si se omite, se usa el nombre de la carpeta.
- `description`: (OBLIGATORIO). Es fundamental escribir una descripción detallada que permita a la IA descubrir y decidir cuándo usar esta habilidad frente a otras.

### Consejos de Redacción para SKILL.md
1. **Sé directo y específico:** Escribe las instrucciones como listas de pasos claros (1, 2, 3..).
2. **Propósito único:** Una habilidad debe centrarse en un único flujo de trabajo o dominio. Si la tarea es muy grande, crear múltiples habilidades puede ser mejor.
3. **Manejo de Scripts (Cajas Negras):** Si incluyes scripts complejos en la carpeta `scripts/`, no le pidas a la IA que lea y aprenda el código del script. En su lugar, diseña el script para que actúe como una herramienta CLI e instruye a la IA para que lo ejecute usando el comando `--help`.
4. **Incluye Árboles de Decisión:** Si hay distintos casos de uso, usa estructuras "Si pasa A, haz B; Si pasa C, haz D".

## 5. Pasos para Actuar como Creador
Cuando te pidan crear una nueva habilidad, sigue estos pasos secuenciales:

1. **Analiza el requerimiento:** Pregunta al usuario por todos los detalles, scripts que deben incluirse, y el alcance (local o global).
2. **Diseña el directorio:** Crea la ruta con `mkdir -p .agent/skills/<nombre>`.
3. **Redacta el Frontmatter:** Asegúrate de que la `description` sea exhaustiva y orientada a ser leída por un sistema automatizado de búsqueda semántica.
4. **Escribe las instrucciones (SKILL.md):** Utilizando las mejores prácticas antes mencionadas, usando herramientas de escritura de archivos (`write_to_file`).
5. **(Opcional) Agrega scripts:** Si es necesario, guarda herramientas adicionales en un subdirectorio `scripts/`.
