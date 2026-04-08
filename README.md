# Angular 19 — Plataforma de Aprendizaje de Testing

Plataforma educativa para aprender a testear aplicaciones Angular 19 con **Jest** y **Playwright**.

Incluye guia de migracion desde Karma/Jasmine, ejemplos progresivos de unit testing por categoria,
y proximamente ejemplos de functional tests, e2e tests y ejercicios practicos.

---

## Que incluye actualmente?

### Guia de Migracion (Karma/Jasmine -> Jest + Playwright)

Pasos detallados para reemplazar el setup de testing por defecto de Angular 19 con Jest + Playwright.

| Archivo | Para quien | Descripcion |
|---------|-----------|-------------|
| [`docs/guia-migracion-jest-playwright.md`](docs/guia-migracion-jest-playwright.md) | Desarrolladores | Guia paso a paso con explicaciones de cada decision |
| [`skills/migracion-jest-playwright.md`](skills/migracion-jest-playwright.md) | Claude Code | Skill para ejecutar la migracion automaticamente |

### Ejemplos de Unit Testing (`examples/unit-test/`)

8 categorias organizadas por nivel de dificultad, cada una con implementacion, tests y documentacion.

> Empieza por [`roadmap-unit-test.md`](src/app/examples/unit-test/roadmap-unit-test.md) para ver el orden recomendado.
> Lee [`unit-testing-guide.md`](src/app/examples/unit-test/unit-testing-guide.md) para la filosofia general.

| # | Categoria | Nivel | Concepto principal | Herramientas clave |
|---|-----------|-------|--------------------|--------------------|
| 1 | `pipes/` | Basico | Funciones puras sin Angular | Instanciacion directa, sin TestBed |
| 2 | `validators/` | Basico-Intermedio | FormControl + validacion async | `fakeAsync`, `tick`, `FormGroup` |
| 3 | `services/` | Intermedio | Servicios con HTTP | `TestBed`, `HttpTestingController`, `firstValueFrom` |
| 4 | `guards/` | Intermedio | Guards funcionales con inject() | `runInInjectionContext`, mock de ActivatedRouteSnapshot |
| 5 | `resolvers/` | Intermedio | Resolvers funcionales con datos | Mismo patron que guards, `EMPTY`, `jest.spyOn` |
| 6 | `interceptors/` | Intermedio-Avanzado | Middleware HTTP | `withInterceptors()`, verificar headers, manejo de 401 |
| 7 | `directives/` | Intermedio | Directivas de atributo | Host component pattern, `userEvent.hover` |
| 8 | `components/` | Avanzado | Componente completo con todo | Testing Library, signal inputs/outputs, mocks |

---

## Que viene proximamente?

- **Functional tests** — Ejemplos de tests que prueban flujos completos sin levantar un servidor
- **E2E tests** — Ejemplos educativos de tests end-to-end con Playwright
- **Ejercicios practicos** — Ejercicios con solucion para practicar cada tipo de test

---

## Stack de Testing

| Herramienta | Rol |
|-------------|-----|
| [Jest](https://jestjs.io/) | Test runner para unit tests |
| [jest-preset-angular](https://thymikee.github.io/jest-preset-angular/) | Adaptador de Jest para Angular |
| [Testing Library](https://testing-library.com/docs/angular-testing-library/intro/) | Utilidades para tests basados en comportamiento |
| [Playwright](https://playwright.dev/) | Tests end-to-end |

---

## Comandos

```bash
# Unit tests
pnpm test

# Unit tests con reporte de cobertura
pnpm test:coverage

# Tests e2e
pnpm e2e
```

---

## Estructura del Proyecto

```
├── src/
│   └── app/
│       └── examples/
│           └── unit-test/              # Ejemplos educativos (8 categorias)
│               ├── roadmap-unit-test.md
│               ├── unit-testing-guide.md
│               ├── pipes/
│               ├── validators/
│               ├── services/
│               ├── guards/
│               ├── resolvers/
│               ├── interceptors/
│               ├── directives/
│               └── components/
├── e2e/
│   └── example.e2e.spec.ts             # Ejemplo de test e2e con Playwright
├── docs/
│   └── guia-migracion-jest-playwright.md
├── skills/
│   └── migracion-jest-playwright.md    # Skill para Claude Code
├── AGENTS.md                           # Guia de comportamiento del agente
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

> Los archivos `*.e2e.spec.ts` estan excluidos de Jest via `testPathIgnorePatterns` en `jest.config.js`.

---

## Desarrollo

```bash
# Servidor de desarrollo
ng serve

# Build de produccion
ng build
```
