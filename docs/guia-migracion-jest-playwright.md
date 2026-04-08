# Configuracion de Jest + Playwright para Angular 19

## Descripcion General

Esta guia te lleva paso a paso para reemplazar **Karma/Jasmine** (el setup de testing
por defecto de Angular) con **Jest** para unit tests y agregar **Playwright** para tests
end-to-end (e2e) en un proyecto Angular 19.

**Por que hacer este cambio?**

- **Jest** es mas rapido que Karma, tiene mejor DX, soporte de snapshots, y es el estandar de la industria
- **Testing Library** promueve tests basados en comportamiento del usuario, no en implementacion interna
- **Playwright** es un framework e2e moderno, rapido y confiable con auto-waiting

---

## Prerequisitos

- Un proyecto Angular 19 existente (`ng new mi-proyecto`)
- Node.js y pnpm instalados
- Haber ejecutado `pnpm install` (que exista `node_modules/`)

---

## Nota Importante sobre Versiones

> Las versiones de paquetes listadas en esta guia son especificas para **Angular 19**.
> Si usas otra version de Angular (+v16), busca las versiones compatibles de cada paquete por tu cuenta.
> Cada comando incluye entre parentesis la version exacta para Angular 19 como referencia.

---

## Paso 1: Desinstalar Karma y Jasmine

**Por que:** Angular 19 incluye Karma y Jasmine como test runner por defecto. Los removemos
porque vamos a reemplazarlos completamente con Jest. Dejarlos instalados puede causar
conflictos de tipos y confusion.

```bash
pnpm remove karma karma-chrome-launcher karma-coverage karma-jasmine karma-jasmine-html-reporter @types/jasmine
```

**Que se remueve y por que:**
| Paquete | Razon de remocion |
|---------|-------------------|
| `karma` | Test runner, lo reemplaza Jest |
| `karma-chrome-launcher` | Launcher de Chrome para Karma, ya no se necesita |
| `karma-coverage` | Cobertura de Karma, Jest tiene la suya integrada |
| `karma-jasmine` | Adaptador Jasmine-Karma, ya no se necesitan ninguno de los dos |
| `karma-jasmine-html-reporter` | Reporter HTML de Karma, Jest tiene reporters propios |
| `@types/jasmine` | Types de Jasmine, los reemplazaremos con types de Jest |

---

## Paso 2: Instalar Testing Library

**Por que:** `@testing-library/angular` te permite escribir tests que interactuan con
tus componentes de la misma manera que un usuario real lo haria (buscando por texto,
por rol, por label). Esto hace tus tests mas resilientes a refactors internos.

- **jest-dom** agrega matchers utiles como `toBeVisible()`, `toHaveTextContent()`
- **user-event** simula interacciones reales del usuario (click, type, etc.)

```bash
ng add @testing-library/angular
```

**(Angular 19 -> @testing-library/angular@17.3.4)**

Cuando te pregunte:

- **Agregar jest-dom?** -> Escribe **y** (agrega matchers extendidos para el DOM)
- **Agregar user-event?** -> Escribe **y** (simula eventos de usuario de forma realista)

---

## Paso 3: Instalar types de testing-library

**Por que:** Este paquete contiene las definiciones de TypeScript para los matchers de
`jest-dom`. Sin el, TypeScript marcara errores cuando uses matchers como `toBeVisible()`
o `toHaveTextContent()` en tus archivos de test.

```bash
pnpm add -D @types/testing-library__jest-dom
```

**(Angular 19 -> @types/testing-library__jest-dom@5.14.9)**

---

## Paso 4: Instalar Jest

**Por que:**

- `jest` es el test runner que reemplaza a Karma
- `jest-preset-angular` es un preset que configura Jest especificamente para Angular: maneja la compilacion de templates HTML, estilos SCSS, decorators como @Component, etc.
- `@jest/globals` provee las funciones globales de Jest (`describe`, `it`, `expect`) con tipos de TypeScript completos

```bash
pnpm add -D jest jest-preset-angular @jest/globals
```

**(Angular 19 -> jest@29.7.0, jest-preset-angular@14.4.2, @jest/globals@30.3.0)**

---

## Paso 5: Instalar Playwright mediante e2e

**Por que:** Playwright es un framework de testing e2e moderno. Al ejecutar `ng e2e`,
Angular detecta que no hay framework e2e configurado y te ofrece instalar uno.
Playwright soporta multiples navegadores, tiene auto-waiting (espera automaticamente
a que los elementos esten listos), y genera reportes detallados.

```bash
ng e2e
```

**(Angular 19 -> @playwright/test@1.59.1, playwright-ng-schematics@2.0.3)**

Cuando te pregunte:

- **Seleccionar framework:** Elige **Playwright**
- **Agregar schematics?** -> Escribe **y**
- **Agregar browsers?** -> Escribe **y** (descarga los navegadores automaticamente)

**Este comando crea automaticamente:**

- `e2e/example.spec.ts` - Test de ejemplo
- `e2e/tsconfig.json` - Configuracion TypeScript para e2e
- `playwright.config.ts` - Configuracion de Playwright
- Modifica `angular.json` agregando el builder e2e
- Modifica `package.json` agregando el script `"e2e": "ng e2e"`
- Modifica `.gitignore` agregando:
  ```
  /test-results/
  /playwright-report/
  /playwright/.cache/
  ```

---

## Paso 6: Remover navegadores Firefox y Safari de Playwright

**Por que:** Para desarrollo local solo necesitamos Chromium. Firefox y Safari agregan
tiempo de ejecucion significativo y rara vez encuentran bugs diferentes durante el
desarrollo. Si los necesitas para CI/CD, puedes descomentarlos despues.

**Archivo:** `playwright.config.ts`

Comenta los bloques de `firefox` y `webkit` en el array `projects`, dejando solo `chromium`:

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

## Paso 7: Configurar Jest en tsconfig.spec.json

**Por que:** `tsconfig.spec.json` le dice a TypeScript que tipos usar para compilar los
archivos de test. Por defecto tiene `"jasmine"` porque Angular viene con Jasmine.
Cambiamos a `"jest"` y `"@testing-library/jest-dom"` para que TypeScript reconozca
las funciones de Jest (`describe`, `it`, `expect`) y los matchers de jest-dom
(`toBeVisible`, `toHaveTextContent`, etc.).

**Archivo:** `tsconfig.spec.json`

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

**Archivo completo resultante:**

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

## Paso 8: Crear archivo setup-jest.ts

**Por que:** Este archivo se ejecuta **antes** de cada suite de tests:

- `setupZoneTestEnv()` inicializa el entorno de Zone.js que Angular necesita para
  detectar cambios asincronos durante los tests
- `import '@testing-library/jest-dom'` carga los matchers extendidos de jest-dom
  globalmente para que esten disponibles en todos tus archivos de test

> **IMPORTANTE:** El archivo se llama **`setup-jest.ts`** (NO `jest-setup.ts`).
> Este nombre debe coincidir con lo que pondremos en `jest.config.js`.

**Crear archivo:** `setup-jest.ts` en la raiz del proyecto

```typescript
import { setupZoneTestEnv } from "jest-preset-angular/setup-env/zone";
setupZoneTestEnv();

import "@testing-library/jest-dom";
```

---

## Paso 9: Crear archivo jest.config.js

**Por que:** Este es el archivo de configuracion principal de Jest:

- `preset: 'jest-preset-angular'` - usa el preset que sabe compilar componentes Angular
- `setupFilesAfterEnv` - apunta al `setup-jest.ts` que inicializa zone.js y jest-dom
- `testPathIgnorePatterns` - **CRITICO:** excluye archivos e2e (`.e2e.spec.ts`) y funcionales para que Jest no intente ejecutarlos (usan la API de Playwright, no de Jest)
- `globalSetup` - inicializa el entorno global de jest-preset-angular

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

## Paso 10: Remover seccion "test" de angular.json

**Por que:** La seccion `"test"` en `angular.json` configura el builder de Karma
(`@angular-devkit/build-angular:karma`). Ya que ahora usamos Jest directamente desde
la linea de comandos (`pnpm test`), esta seccion no es necesaria y puede causar
confusion si alguien ejecuta `ng test` por accidente.

**Archivo:** `angular.json`

Eliminar todo el bloque `"test"` dentro de `architect`. Es el bloque que se ve asi:

```json
"test": {
  "builder": "@angular-devkit/build-angular:karma",
  "options": {
    "polyfills": [
      "zone.js",
      "zone.js/testing"
    ],
    "tsConfig": "tsconfig.spec.json",
    "inlineStyleLanguage": "scss",
    "assets": [
      {
        "glob": "**/*",
        "input": "public"
      }
    ],
    "styles": [
      "src/styles.scss"
    ],
    "scripts": []
  }
},
```

Elimina todo ese bloque (incluyendo la coma que le sigue o precede).

> **NO elimines** la seccion `"e2e"` que agregamos en el paso 5.

---

## Paso 11: Configurar scripts de test en package.json

**Por que:** Cambiamos el script `"test"` para que invoque Jest directamente en lugar de
`ng test` (que usaba Karma). Tambien agregamos `"test:coverage"` para generar reportes
de cobertura de codigo, util para saber que partes de tu aplicacion estan testeadas.

**Archivo:** `package.json`

En la seccion `"scripts"`:

1. Cambiar `"test": "ng test"` por `"test": "jest"`
2. Agregar `"test:coverage": "jest --coverage"`

```json
"scripts": {
  "ng": "ng",
  "start": "ng serve",
  "build": "ng build",
  "watch": "ng build --watch --configuration development",
  "test": "jest",
  "test:coverage": "jest --coverage",
  "e2e": "ng e2e"
}
```

---

## Paso 12: Renombrar archivo de ejemplo e2e

**Por que:** Playwright creo el archivo como `example.spec.ts`, pero Jest tambien busca
archivos `*.spec.ts` para ejecutar. Si lo dejamos asi, Jest intentara ejecutar el test
de Playwright y fallara porque usan APIs completamente diferentes.

Al renombrarlo a `.e2e.spec.ts`, Jest lo ignora gracias al patron `.*\\.e2e\\.spec\\.ts$`
que configuramos en `testPathIgnorePatterns` de `jest.config.js`.

**Renombrar:**

```
e2e/example.spec.ts  ->  e2e/example.e2e.spec.ts
```

> **CONVENCION IMPORTANTE:** De aqui en adelante, todos tus archivos de test e2e
> deben usar la extension **`.e2e.spec.ts`** para que Jest los ignore y solo
> Playwright los ejecute.

---

## Paso 13: Verificar que todo funcione

Ejecuta los tests para confirmar que la configuracion es correcta:

```bash
pnpm test
```

```bash
pnpm test:coverage
```

**Que esperar:**

- Jest debe ejecutarse y mostrar resultados (PASS o FAIL)
- Si los tests fallan, **esta bien** -- lo importante es que Jest se ejecute correctamente
- El test por defecto puede fallar si el titulo del componente no coincide con lo que espera el test
- Si ves errores de configuracion (no encuentra modulos, tipos, etc.), revisa los pasos anteriores

**Si todo esta correcto veras algo como:**

```
PASS  src/app/app.component.spec.ts
  AppComponent
    ✓ should create the app
    ✓ should have the 'mi-proyecto' title
    ✓ should render title

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
```

---

## Resumen de Archivos Creados y Modificados

| Archivo                   | Accion                                                         | Paso              |
| ------------------------- | -------------------------------------------------------------- | ----------------- |
| `package.json`            | Modificado (desinstalar karma, instalar deps, cambiar scripts) | 1, 2, 3, 4, 5, 11 |
| `angular.json`            | Modificado (agregar e2e, remover test)                         | 5, 10             |
| `tsconfig.spec.json`      | Modificado (cambiar types jasmine -> jest)                     | 7                 |
| `setup-jest.ts`           | **Creado**                                                     | 8                 |
| `jest.config.js`          | **Creado**                                                     | 9                 |
| `playwright.config.ts`    | **Creado** (por ng e2e), luego modificado                      | 5, 6              |
| `e2e/tsconfig.json`       | **Creado** (por ng e2e)                                        | 5                 |
| `e2e/example.e2e.spec.ts` | **Creado** (por ng e2e) y renombrado                           | 5, 12             |
| `.gitignore`              | Modificado (entradas de Playwright)                            | 5                 |

---

## Solucion de Problemas Comunes

### "Cannot find type definition file for 'jasmine'"

**Causa:** `tsconfig.spec.json` todavia tiene `"jasmine"` en types.
**Solucion:** Verifica el paso 7. El array types debe tener `"jest"` y `"@testing-library/jest-dom"`.

### Jest intenta ejecutar archivos .e2e.spec.ts

**Causa:** `testPathIgnorePatterns` en `jest.config.js` no tiene el patron correcto o tiene un typo.
**Solucion:** Verifica el paso 9. Asegurate que es `testPathIgnorePatterns` (I mayuscula) y que incluye `'.*\\.e2e\\.spec\\.ts$'`.

### "Cannot find name 'describe'" o "Cannot find name 'expect'"

**Causa:** TypeScript no reconoce las funciones globales de Jest.
**Solucion:** Verifica que `jest.config.js` tiene `preset: 'jest-preset-angular'` (paso 9) y que `tsconfig.spec.json` tiene `"jest"` en types (paso 7).

### "zone.js/testing is not a module"

**Causa:** El archivo de setup esta usando un import incorrecto.
**Solucion:** Verifica el paso 8. Debe usar `setupZoneTestEnv` de `'jest-preset-angular/setup-env/zone'`, no importar `zone.js/testing` directamente.

### Playwright no encuentra tests

**Causa:** Los archivos e2e no tienen la extension correcta o `playwright.config.ts` tiene el `testDir` incorrecto.
**Solucion:** Verifica que `testDir` sea `'./e2e'` en `playwright.config.ts` y que tus tests esten en la carpeta `e2e/`.

---

## Versiones de Referencia (Angular 19)

| Paquete                            | Version |
| ---------------------------------- | ------- |
| `@testing-library/angular`         | ^17.3.4 |
| `@testing-library/dom`             | ^10.0.0 |
| `@testing-library/jest-dom`        | ^6.4.8  |
| `@testing-library/user-event`      | ^14.5.2 |
| `@types/testing-library__jest-dom` | ^5.14.9 |
| `jest`                             | ^29.7.0 |
| `jest-preset-angular`              | ^14.4.2 |
| `@jest/globals`                    | ^30.3.0 |
| `@playwright/test`                 | 1.59.1  |
| `playwright-ng-schematics`         | ^2.0.3  |
