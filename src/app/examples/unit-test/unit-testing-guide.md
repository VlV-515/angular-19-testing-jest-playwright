# Guia de Unit Testing en Angular 19 con Jest

## Que son los Unit Tests?

Los **unit tests** (pruebas unitarias) son pruebas automatizadas que verifican el comportamiento
de **una sola pieza de codigo de forma aislada**. Esa "pieza" puede ser:

- Una funcion
- Una clase (servicio, pipe, directiva)
- Un componente individual

La palabra clave es **aislada**: cada test verifica UNA sola cosa, sin depender de
bases de datos, APIs externas, ni de otros componentes.

### Por que importan?

1. **Confianza al refactorizar** - Si cambias algo y los tests siguen pasando, no rompiste nada
2. **Documentacion viva** - Los tests describen que hace tu codigo (`it('should redirect to dashboard when login succeeds')`)
3. **Deteccion temprana de bugs** - Encuentras errores antes de que lleguen a produccion
4. **Diseno limpio** - Codigo dificil de testear suele ser codigo mal disenado

---

## Principio fundamental: "Testea lo tuyo, no lo ajeno"

Este es el concepto mas importante y el que causa mas confusion al principio.

### Que significa?

Cuando testeas un servicio que hace una peticion HTTP, **NO estas probando que HttpClient funcione**.
Angular ya testea eso. **Estas probando que TU codigo llama correctamente a HttpClient**.

### Analogia

Imagina que envias una carta por correo:

- **NO testeas** que el servicio postal funcione (eso es responsabilidad del correo)
- **SI testeas** que TU carta tiene la direccion correcta, el remitente correcto y el contenido correcto

### En codigo

```typescript
// Tu servicio
login(email: string, password: string): Observable<{ token: string }> {
  return this.http.post<{ token: string }>('/api/login', { email, password });
}
```

En el test verificas:
- Que se llame a `http.post` (no a `http.get`) ← TU decision
- Que la URL sea `/api/login` ← TU decision
- Que el body tenga `{ email, password }` ← TU decision
- **NO** verificas que la peticion HTTP realmente llegue a un servidor

### Por que simulamos (mock)?

Un **mock** es un "doble" que reemplaza algo real en los tests:

| Razon | Explicacion |
|-------|-------------|
| **Aislamiento** | Cada test prueba UNA sola cosa. Si falla, sabes exactamente donde esta el problema |
| **Velocidad** | No hacemos peticiones HTTP reales (que tardarian segundos) |
| **Determinismo** | Controlamos exactamente que "responde el servidor". Sin mocks, un test podria fallar porque el servidor esta caido |
| **Sin efectos secundarios** | No creamos datos reales en bases de datos |

### Herramientas para mockear en Jest + Angular

```typescript
// Mock de una funcion
const myFn = jest.fn();
myFn.mockReturnValue('valor simulado');

// Mock tipado de un servicio completo
const serviceMock = { metodo: jest.fn() } as unknown as jest.Mocked<MiServicio>;

// Mock de peticiones HTTP (Angular)
const httpTesting = TestBed.inject(HttpTestingController);
const req = httpTesting.expectOne('/api/endpoint'); // Intercepta la peticion
req.flush({ data: 'respuesta simulada' });          // Simula la respuesta del servidor
```

---

## El patron Given-When-Then

Todos los tests en este proyecto siguen este patron para mantener claridad:

```typescript
it('should redirect to dashboard when login succeeds', async () => {
  //! Given (Dado que) - Preparar datos, mocks, estado inicial
  const email = 'user@email.com';
  const password = 'pass123';
  authMock.login.mockReturnValueOnce(of({ token: 'abc' }));

  //! When (Cuando) - Ejecutar la accion que queremos probar
  await userEvent.type(screen.getByPlaceholderText('Email'), email);
  await userEvent.click(screen.getByRole('button', { name: /login/i }));

  //! Then (Entonces) - Verificar que el resultado es el esperado
  expect(authMock.login).toHaveBeenCalledWith(email, password);
  expect(window.location.href).toBe('/dashboard');
});
```

### Desglose

| Seccion | Que haces | Comentario en el codigo |
|---------|-----------|------------------------|
| **Given** | Preparas todo: datos de prueba, mocks, renderizas componentes | `//! Given (Dado que)` |
| **When** | Ejecutas la funcionalidad que quieres probar | `//! When (Cuando)` |
| **Then** | Verificas que el resultado sea el esperado con `expect()` | `//! Then (Entonces)` |

---

## TestBed: el laboratorio de Angular

`TestBed` es el entorno de testing de Angular. Piensa en el como un **mini modulo de Angular**
configurado solo para tu test.

### Cuando SI necesitas TestBed

- **Servicios con inyeccion de dependencias** (HttpClient, Router, etc.)
- **Componentes** (necesitan compilar templates)
- **Guards, Resolvers, Interceptors** funcionales que usan `inject()`
- **Directivas** (necesitan un elemento DOM)

### Cuando NO necesitas TestBed

- **Pipes puras** - Son clases simples con un metodo `transform()`. Las instancias manualmente.
- **Funciones puras** - Validadores, utilidades, helpers
- **Clases sin inyeccion** - Cualquier clase que no use `inject()` ni decoradores Angular

### Ejemplo de configuracion

```typescript
beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withFetch()),       // Para que el servicio pueda hacer HTTP
      provideHttpClientTesting(),            // Para interceptar esas peticiones en el test
      MiServicio,                            // El servicio que vamos a probar
    ],
  });

  service = TestBed.inject(MiServicio);      // Obtenemos la instancia del servicio
});
```

### Para functional guards/resolvers/interceptors (Angular 19)

Las funciones que usan `inject()` necesitan ejecutarse dentro del contexto de inyeccion de Angular:

```typescript
const result = TestBed.runInInjectionContext(() => {
  return myGuard(mockRoute, mockState); // La funcion puede usar inject() internamente
});
```

---

## Diferencia entre Unit Test, Functional Test y E2E Test

| Caracteristica | Unit Test | Functional Test | E2E Test |
|---------------|-----------|-----------------|----------|
| **Que prueba** | Una pieza aislada | Un flujo de usuario en componentes | La app completa en un navegador |
| **Herramienta** | Jest | Jest + Testing Library | Playwright |
| **Velocidad** | Muy rapido (ms) | Rapido (ms-s) | Lento (s-min) |
| **Alcance** | Una funcion/clase | Un componente + interacciones | Toda la aplicacion |
| **Dependencias** | Mockeadas | Parcialmente mockeadas | Reales (backend, DB) |
| **Fragilidad** | Baja | Media | Alta |
| **Ejemplo** | "el metodo suma() retorna 5" | "al hacer click en Login, se muestra el dashboard" | "el usuario puede registrarse y comprar un producto" |

### La piramide de testing

```
        /\
       /  \        E2E Tests (pocos, lentos, costosos)
      /    \       Prueban flujos completos
     /------\
    /        \     Functional Tests (algunos)
   /          \    Prueban interacciones de usuario
  /------------\
 /              \  Unit Tests (muchos, rapidos, baratos)
/                \ Prueban logica aislada
------------------
```

**Regla general:** Muchos unit tests, algunos functional tests, pocos e2e tests.

---

## Mejores practicas

### 1. Nombres descriptivos
```typescript
// Malo
it('test login', ...)

// Bueno
it('should redirect to dashboard when login succeeds', ...)
it('should show error message when credentials are invalid', ...)
```

### 2. Cada test es independiente
Cada `it()` debe poder ejecutarse solo, sin depender de otros tests.
Usa `beforeEach` para resetear el estado antes de cada test.

### 3. No testees implementacion, testea comportamiento
```typescript
// Malo - testea implementacion interna
expect(component.isLoading).toBe(true);

// Bueno - testea lo que el usuario ve
expect(screen.getByText('Cargando...')).toBeInTheDocument();
```

### 4. Un concepto por test
```typescript
// Malo - prueba muchas cosas
it('should login and redirect and show welcome message', ...)

// Bueno - un concepto por test
it('should redirect to dashboard when login succeeds', ...)
it('should show welcome message after login', ...)
```

### 5. Usa Testing Library para componentes
Testing Library promueve tests que simulan como el usuario interactua con la UI:
- `screen.getByRole('button')` en vez de `fixture.debugElement.query(By.css('button'))`
- `userEvent.click()` en vez de `button.triggerEventHandler('click')`

### 6. afterEach con verify() para HTTP
```typescript
afterEach(() => {
  httpTesting.verify(); // Verifica que no haya peticiones HTTP pendientes sin resolver
});
```

### 7. Prefiere `firstValueFrom` para Observables en tests
```typescript
// Convierte un Observable a Promise para poder usar await
const result = await firstValueFrom(service.getData());
expect(result).toEqual(expectedData);
```

---

## Orden recomendado para estudiar los ejemplos

| # | Carpeta | Nivel | Concepto principal |
|---|---------|-------|--------------------|
| 1 | `pipes/` | Basico | Testear funciones puras sin TestBed |
| 2 | `validators/` | Basico-Intermedio | Funciones puras + FormControl + async |
| 3 | `services/` | Intermedio | TestBed + HttpTestingController |
| 4 | `guards/` | Intermedio | runInInjectionContext + mock de Router |
| 5 | `resolvers/` | Intermedio | Consolida patron de guards |
| 6 | `interceptors/` | Intermedio-Avanzado | withInterceptors + verificar headers |
| 7 | `directives/` | Intermedio | Host component pattern |
| 8 | `components/` | Avanzado | Integra todos los conceptos |

Cada carpeta contiene un archivo `.md` con la documentacion detallada del ejemplo.
