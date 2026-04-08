# Skill: Migrar a Jest + Playwright en Angular 19

## Descripcion

Configura automaticamente el boilerplate de testing con **Jest** (unit tests) y **Playwright**
(e2e tests) en un proyecto Angular 19, reemplazando Karma/Jasmine que viene por defecto.

**Version objetivo:** Angular 19
**Para otras versiones de Angular (+v16):** Las versiones de los paquetes cambian. Busca las versiones compatibles por tu cuenta.

---

## Prerequisitos

Antes de ejecutar cualquier paso, verifica:

1. Que exista `angular.json` en la raiz del proyecto (confirma que es un proyecto Angular)
2. Que exista `package.json`
3. Que exista `node_modules/` (que ya se haya corrido `pnpm install`)
4. Que el proyecto use Angular 19 (verificar en `package.json` -> `@angular/core`)

---

## Pasos

### Paso 1: Desinstalar Karma y Jasmine

<!-- POR QUE: Angular 19 incluye Karma y Jasmine como test runner por defecto.
     Los desinstalamos porque vamos a reemplazarlos con Jest, que es mas rapido,
     tiene mejor soporte de snapshots, mejor DX (developer experience), y es
     el estandar de facto en la comunidad. -->

```bash
pnpm remove karma karma-chrome-launcher karma-coverage karma-jasmine karma-jasmine-html-reporter @types/jasmine
```

**Paquetes que se remueven:**

- `karma` - Test runner que ya no usaremos
- `karma-chrome-launcher` - Launcher de Chrome para Karma
- `karma-coverage` - Reporte de cobertura de Karma
- `karma-jasmine` - Adaptador de Jasmine para Karma
- `karma-jasmine-html-reporter` - Reporter HTML de Jasmine
- `@types/jasmine` - Types de Jasmine (los reemplazaremos con types de Jest)

---

### Paso 2: Instalar Testing Library

<!-- POR QUE: @testing-library/angular promueve tests basados en comportamiento del usuario
     (como el usuario interactua con la UI) en lugar de tests basados en la implementacion
     interna del componente. Esto hace los tests mas resilientes a refactors.
     - jest-dom: agrega matchers como toBeVisible(), toHaveTextContent(), etc.
     - user-event: simula interacciones reales del usuario (click, type, etc.) -->

```bash
ng add @testing-library/angular
```

**Opciones interactivas (responder 'y' a ambas):**

- Agregar jest-dom? -> **y**
- Agregar user-event? -> **y**

**(Angular 19 -> @testing-library/angular@17.3.4)** - Verifica tu version compatible.

**Paquetes que se agregan:**

- `@testing-library/angular` ^17.3.4
- `@testing-library/dom` ^10.0.0
- `@testing-library/jest-dom` ^6.4.8
- `@testing-library/user-event` ^14.5.2

---

### Paso 3: Instalar types de testing-library

<!-- POR QUE: Este paquete provee las definiciones de TypeScript para los matchers
     de jest-dom (toBeVisible, toHaveTextContent, etc.). Sin esto, TypeScript
     marcara errores en los archivos de test cuando uses estos matchers. -->

```bash
pnpm add -D @types/testing-library__jest-dom
```

**(Angular 19 -> @types/testing-library__jest-dom@5.14.9)**

---

### Paso 4: Instalar Jest

<!-- POR QUE:
     - jest: El test runner que reemplaza a Karma
     - jest-preset-angular: Preset que configura Jest especificamente para Angular
       (maneja la compilacion de templates, styles, decorators, etc.)
     - @jest/globals: Provee los tipos y funciones globales de Jest (describe, it, expect)
       con soporte completo de TypeScript -->

```bash
pnpm add -D jest jest-preset-angular @jest/globals
```

**(Angular 19 -> jest@29.7.0, jest-preset-angular@14.4.2)**

---

### Paso 5: Instalar Playwright mediante e2e

<!-- POR QUE: Playwright es un framework de testing e2e (end-to-end) moderno, rapido
     y confiable. Usando `ng e2e` Angular detecta que no hay framework e2e configurado
     y ofrece instalar uno. Playwright soporta multiples navegadores y tiene
     auto-waiting, lo que reduce tests flaky. -->

```bash
ng e2e
```

**Opciones interactivas:**

- Seleccionar: **Playwright**
- Agregar schematics? -> **y**
- Agregar browsers? -> **y**

**(Angular 19 -> @playwright/test@1.59.1, playwright-ng-schematics@2.0.3)**

**Este comando automaticamente:**

- Crea `e2e/example.spec.ts` (archivo de test de ejemplo)
- Crea `e2e/tsconfig.json`
- Crea `playwright.config.ts`
- Agrega la seccion `e2e` al architect en `angular.json`
- Agrega el script `"e2e": "ng e2e"` a `package.json`
- Agrega entradas de Playwright a `.gitignore`:
  ```
  /test-results/
  /playwright-report/
  /playwright/.cache/
  ```

---

### Paso 6: Remover navegadores Firefox y Safari de Playwright

<!-- POR QUE: Para desarrollo local solo necesitamos Chromium. Firefox y Safari
     agregan tiempo de ejecucion significativo y rara vez atrapan bugs diferentes
     en desarrollo. Si los necesitas para CI, puedes descomentarlos despues. -->

**Archivo a modificar:** `playwright.config.ts`

En el array `projects`, **comentar** los bloques de `firefox` y `webkit`, dejando solo `chromium` activo:

```typescript
projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
],
```

---

### Paso 7: Configurar Jest en tsconfig.spec.json

<!-- POR QUE: tsconfig.spec.json le dice a TypeScript que tipos usar para los tests.
     Por defecto tiene "jasmine" porque Angular viene con Jasmine.
     Lo cambiamos a "jest" y "@testing-library/jest-dom" para que TypeScript
     reconozca las funciones de Jest (describe, it, expect) y los matchers
     de jest-dom (toBeVisible, toHaveTextContent, etc.) -->

**Archivo a modificar:** `tsconfig.spec.json`

Cambiar el array `types` de:

```json
"types": ["jasmine"]
```

A:

```json
"types": [
  "jest",
  "@testing-library/jest-dom"
]
```

**El archivo completo debe quedar asi:**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/spec",
    "types": ["jest", "@testing-library/jest-dom"]
  },
  "include": ["src/**/*.spec.ts", "src/**/*.d.ts"]
}
```

---

### Paso 8: Crear archivo setup-jest.ts

<!-- POR QUE: Este archivo se ejecuta ANTES de cada suite de tests.
     - setupZoneTestEnv(): Inicializa el entorno de testing de Zone.js que Angular
       necesita para detectar cambios asincrono en tests.
     - import jest-dom: Carga los matchers extendidos de jest-dom globalmente
       para que esten disponibles en todos los archivos de test. -->

> **IMPORTANTE:** El archivo se llama `setup-jest.ts` (NO `jest-setup.ts`)

**Crear archivo:** `setup-jest.ts` en la raiz del proyecto

```typescript
import { setupZoneTestEnv } from "jest-preset-angular/setup-env/zone";
setupZoneTestEnv();

import "@testing-library/jest-dom";
```

---

### Paso 9: Crear archivo jest.config.js

<!-- POR QUE: Este es el archivo de configuracion principal de Jest.
     - preset: usa jest-preset-angular que ya sabe como compilar componentes Angular
     - setupFilesAfterEnv: apunta al setup-jest.ts que inicializa zone.js y jest-dom
     - testPathIgnorePatterns: CRITICO - excluye archivos e2e y funcionales para que
       Jest no intente ejecutar tests de Playwright (que tienen otra sintaxis)
     - globalSetup: inicializa el entorno global de jest-preset-angular -->

**Crear archivo:** `jest.config.js` en la raiz del proyecto

```javascript
module.exports = {
  preset: "jest-preset-angular",
  setupFilesAfterEnv: ["<rootDir>/setup-jest.ts"],
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/dist/",
    //Ignore e2e & functional because they are tested with Playwright, see playwright.config.ts
    ".*\\.e2e\\.spec\\.ts$",
    ".*\\.functional\\.ts$",
  ],
  globalSetup: "jest-preset-angular/global-setup",
};
```

---

### Paso 10: Remover seccion "test" de angular.json

<!-- POR QUE: La seccion "test" en angular.json configura el builder de Karma
     (@angular-devkit/build-angular:karma). Ya que ahora usamos Jest directamente
     desde la linea de comandos (pnpm test), esta seccion ya no es necesaria
     y puede causar confusion. -->

**Archivo a modificar:** `angular.json`

Eliminar todo el bloque `"test"` del objeto `architect`. Es el bloque que contiene:

```json
"test": {
  "builder": "@angular-devkit/build-angular:karma",
  ...
}
```

Eliminar todo ese bloque completo (aproximadamente 20 lineas).

**NO eliminar** la seccion `"e2e"` que se agrego en el paso 5.

---

### Paso 11: Configurar scripts de test en package.json

<!-- POR QUE: Cambiamos el script "test" para que invoque Jest directamente
     en lugar de "ng test" (que usaba Karma).
     Agregamos "test:coverage" para generar reportes de cobertura de codigo. -->

**Archivo a modificar:** `package.json`

En la seccion `"scripts"`:

1. Cambiar `"test": "ng test"` por `"test": "jest"`
2. Agregar `"test:coverage": "jest --coverage"`

```json
"scripts": {
  ...
  "test": "jest",
  "test:coverage": "jest --coverage",
  ...
}
```

---

### Paso 12: Renombrar archivo de ejemplo e2e

<!-- POR QUE: Playwright crea el archivo como example.spec.ts pero Jest tambien
     busca archivos *.spec.ts. Para evitar que Jest intente ejecutar tests de
     Playwright (lo cual fallaria porque usan APIs diferentes), renombramos
     el archivo a .e2e.spec.ts que Jest ignora gracias al patron en
     testPathIgnorePatterns de jest.config.js -->

**Renombrar:** `e2e/example.spec.ts` -> `e2e/example.e2e.spec.ts`

```bash
mv e2e/example.spec.ts e2e/example.e2e.spec.ts
```

> **CONVENCION:** Todos los archivos de test e2e deben usar la extension `.e2e.spec.ts`
> para que Jest los ignore y solo Playwright los ejecute.

---

### Paso 13: Verificar que todo funcione

Ejecutar los tests para confirmar que la configuracion es correcta:

```bash
pnpm test
```

```bash
pnpm test:coverage
```

**Resultado esperado:** Los tests deben ejecutarse (aunque pueden fallar si el test
por defecto no coincide con el contenido del componente, lo importante es que Jest
ejecute correctamente, no que los tests pasen).

Si Jest se ejecuta y muestra resultados (pass o fail), la configuracion esta correcta.

---

## Notas Importantes

### Nombres de archivos criticos

- `setup-jest.ts` (NO `jest-setup.ts`) - referenciado en jest.config.js
- `jest.config.js` (NO `jest.config.ts`) - Jest lo busca automaticamente
- `*.e2e.spec.ts` - convencion para tests e2e (excluidos de Jest)
- `*.spec.ts` - convencion para unit tests (ejecutados por Jest)

### Errores comunes

- **"Cannot find type definition file for 'jasmine'"** -> Verifica paso 7 (tsconfig.spec.json debe tener "jest" en types, no "jasmine")
- **Jest ejecuta archivos e2e** -> Verifica paso 9 (`testPathIgnorePatterns` debe incluir `.*\\.e2e\\.spec\\.ts$`)
- **"Cannot find name 'describe'"** -> Verifica que jest.config.js tiene el preset `jest-preset-angular` y que tsconfig.spec.json tiene `"jest"` en types
- **"zone.js/testing is not a module"** -> Verifica que setup-jest.ts usa `setupZoneTestEnv` de `jest-preset-angular/setup-env/zone`

### Sobre las versiones

Las versiones listadas son especificas para **Angular 19**:

- `@testing-library/angular@17.3.4`
- `jest@29.7.0`
- `jest-preset-angular@14.4.2`
- `@jest/globals@30.3.0`
- `@playwright/test@1.59.1`
- `playwright-ng-schematics@2.0.3`

Para otras versiones de Angular, busca las versiones compatibles en npm.
