# Guia del Agente: Plataforma de Aprendizaje de Testing - Angular 19

## Proposito del Proyecto

Este proyecto es una **plataforma educativa para aprender testing en Angular 19**.

Contiene:
- Guia de migracion de Karma/Jasmine a Jest + Playwright (13 pasos)
- Ejemplos progresivos de unit testing (8 categorias, del nivel basico al avanzado)
- Proximamente: ejemplos de functional tests y e2e tests, ejercicios practicos

**Idioma:** Todo el contenido (documentacion, comentarios en tests, archivos `.md`) esta en espanol.

---

## Estructura del Proyecto

```
├── src/app/
│   └── examples/
│       └── unit-test/          # Ejemplos educativos de unit testing (8 categorias)
│           ├── roadmap-unit-test.md
│           ├── unit-testing-guide.md
│           ├── pipes/
│           ├── validators/
│           ├── services/
│           ├── guards/
│           ├── resolvers/
│           ├── interceptors/
│           ├── directives/
│           └── components/
├── e2e/                        # Tests e2e con Playwright
├── docs/                       # Documentacion del proyecto
├── skills/                     # Skills ejecutables por el agente
├── jest.config.js
├── setup-jest.ts
├── playwright.config.ts
└── tsconfig.spec.json
```

---

## Convenciones de Archivos de Test

| Extension | Framework | Ejecutado por |
|-----------|-----------|---------------|
| `*.spec.ts` | Jest | `pnpm test` |
| `*.e2e.spec.ts` | Playwright | `pnpm e2e` |

Los `*.e2e.spec.ts` estan excluidos de Jest via `testPathIgnorePatterns` en `jest.config.js`.
Los `*.functional.ts` tambien estan excluidos (para uso futuro).

---

## Patron para Crear Nuevos Ejemplos de Unit Test

Cuando el usuario pida crear un nuevo ejemplo de unit test, seguir este patron exacto.

### Ubicacion

Todos los ejemplos van en `src/app/examples/unit-test/{categoria}/`.

Las categorias existentes son:
`pipes`, `validators`, `services`, `guards`, `resolvers`, `interceptors`, `directives`, `components`

Si el usuario pide una categoria nueva, crear la carpeta correspondiente dentro de `unit-test/`.

### Archivos requeridos por ejemplo

Cada ejemplo requiere exactamente estos archivos:

1. **Archivo de implementacion Angular** — `{nombre}.{tipo}.ts`
2. **Archivo de test** — `{nombre}.{tipo}.spec.ts`
3. **Archivo de documentacion** — `{categoria}.md`
4. Para componentes: tambien el template — `{nombre}.component.html`

### Convenciones de nomenclatura

- Nombres en kebab-case con el sufijo del tipo Angular:
  - `truncate.pipe.ts` / `truncate.pipe.spec.ts`
  - `auth.guard.ts` / `auth.guard.spec.ts`
  - `product.service.ts` / `product.service.spec.ts`
  - `product-card.component.ts` / `product-card.component.spec.ts`
- Archivo de documentacion: nombre de la categoria + `.md` (ej. `pipes.md`, `guards.md`)

### Convenciones de contenido en archivos `.spec.ts`

**Comentarios educativos:**
- Usar `//?` para explicaciones conceptuales (el "por que" y "que es")
- Usar `//!` para marcar las secciones Given / When / Then dentro de cada `it()`
- Separar grupos de tests con lineas decorativas:
  ```typescript
  // ─────────────────────────────────────────────
  // Descripcion del grupo
  // ─────────────────────────────────────────────
  ```

**Estructura de cada `it()`:**
```typescript
it('should descripcion del comportamiento esperado', () => {
  //! Given
  const valor = ...;

  //! When
  const resultado = sujeto.metodo(valor);

  //! Then
  expect(resultado).toBe(...);
});
```

**Imports:** Usar `@jest/globals` para los tipos de Jest cuando sea necesario.

### Convenciones de contenido en archivos `.md`

Cada archivo `.md` de documentacion debe incluir:

1. **Titulo:** `# Unit Test: {Categoria}` (ej. `# Unit Test: Pipes`)
2. **Que es:** Explicacion breve del concepto Angular (pipe, guard, servicio, etc.)
3. **Por que es facil/dificil de testear:** Contexto educativo del nivel de dificultad
4. **Seccion del archivo de implementacion:** Que hace, parametros, comportamiento
5. **Seccion del archivo de test:** Estructura del describe/it, conceptos clave usados
6. **Comando para ejecutar:**
   ```bash
   pnpm test -- --testPathPattern="nombre-del-archivo"
   ```

Todo en espanol. Seguir el estilo de los `.md` existentes en `src/app/examples/unit-test/`.

### Niveles de dificultad de referencia

| Nivel | Categorias |
|-------|-----------|
| Basico | `pipes` |
| Basico-Intermedio | `validators` |
| Intermedio | `services`, `guards`, `resolvers` |
| Intermedio-Avanzado | `interceptors`, `directives` |
| Avanzado | `components` |

---

## Futuro: Functional Tests

Cuando se agreguen ejemplos de functional tests:

- Directorio: `src/app/examples/functional-test/`
- Extension de archivos: `*.functional.ts` (ya excluida en `jest.config.js`)
- Mismo patron de 3 archivos: implementacion + test + documentacion `.md`
- Crear un `roadmap-functional-test.md` dentro del directorio

---

## Futuro: E2E Tests Educativos

Cuando se agreguen ejemplos educativos de e2e:

- Directorio de tests reales: `e2e/`
- Extension: `*.e2e.spec.ts`
- Mismo patron de documentacion que unit-test

---

## Skills Disponibles

| Skill | Descripcion |
|-------|-------------|
| [`skills/migracion-jest-playwright.md`](skills/migracion-jest-playwright.md) | Migrar un proyecto Angular 19 de Karma/Jasmine a Jest + Playwright (13 pasos) |

Para ejecutar un skill, leer el archivo correspondiente y seguir sus instrucciones paso a paso.
