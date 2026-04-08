# Roadmap: Unit Testing en Angular 19

## Orden de estudio recomendado

| # | Carpeta | Nivel | Concepto principal | Herramientas clave |
|---|---------|-------|--------------------|--------------------|
| 1 | `pipes/` | Basico | Funciones puras sin Angular | Instanciacion directa, sin TestBed |
| 2 | `validators/` | Basico-Intermedio | FormControl + validacion async | `fakeAsync`, `tick`, `FormGroup` |
| 3 | `services/` | Intermedio | Servicios con HTTP | `TestBed`, `HttpTestingController`, `firstValueFrom` |
| 4 | `guards/` | Intermedio | Guards funcionales con inject() | `runInInjectionContext`, mock de ActivatedRouteSnapshot |
| 5 | `resolvers/` | Intermedio | Resolvers funcionales con datos | Mismo patron que guards, `EMPTY`, `jest.spyOn` |
| 6 | `interceptors/` | Intermedio-Avanzado | Middleware HTTP | `withInterceptors()`, verificar headers, manejo de 401 |
| 7 | `directives/` | Intermedio | Directivas de atributo | Host component pattern, `userEvent.hover` |
| 8 | `components/` | Avanzado | Componente completo con todo | Testing Library, signal inputs/outputs, mocks, `@if`/`@switch` |

---

## Detalle por nivel

### Basico

#### 1. `pipes/`
- **Archivo:** `truncate.pipe.ts` — trunca texto con longitud maxima y sufijo configurable
- **Test:** `truncate.pipe.spec.ts`
- **Doc:** `pipes.md`
- **Por que primero:** Las pipes son funciones puras. No necesitan TestBed ni Angular. Solo `new TruncatePipe()` y listo.
- **Aprende:**
  - Testear sin TestBed (instanciacion directa)
  - Edge cases: `null`, `undefined`, string vacio, string exactamente en el limite
  - El test mas basico posible: llamar una funcion y verificar el resultado

---

### Basico-Intermedio

#### 2. `validators/`
- **Archivo:** `password-strength.validator.ts` — validador de fuerza de contrasena (sync) + match de contrasenas (grupo) + disponibilidad de username (async)
- **Test:** `password-strength.validator.spec.ts`
- **Doc:** `validators.md`
- **Por que segundo:** Similar a pipes (funciones puras) pero introduce `FormControl`, `FormGroup` y el concepto de validacion asincrona.
- **Aprende:**
  - `ValidatorFn` sincrono — testear con `new FormControl('valor')`
  - `ValidatorFn` a nivel de grupo — testear con `new FormGroup({ ... }, { validators: [...] })`
  - `AsyncValidatorFn` — `fakeAsync` + `tick(300)` para simular `debounceTime`
  - Mock de servicios como parametro (patron factory)

---

### Intermedio

#### 3. `services/`
- **Archivo:** `product.service.ts` — CRUD de productos con HttpClient y signals de estado
- **Test:** `product.service.spec.ts`
- **Doc:** `services.md`
- **Por que tercero:** Primera vez que necesitas TestBed. Aprende el patron HTTP que se reutiliza en interceptors.
- **Aprende:**
  - `TestBed.configureTestingModule` con `provideHttpClient` + `provideHttpClientTesting`
  - `HttpTestingController.expectOne(url)` para interceptar peticiones
  - `req.flush(data)` para simular respuesta exitosa
  - `req.flush(msg, { status: 500 })` para simular errores
  - `afterEach(() => httpTesting.verify())` como red de seguridad
  - `firstValueFrom()` para convertir Observable a Promise en tests
  - Testear signals: `service.loading()`, `service.products()`

#### 4. `guards/`
- **Archivo:** `auth.guard.ts` — guard funcional (CanActivateFn) con verificacion de autenticacion y roles
- **Test:** `auth.guard.spec.ts`
- **Doc:** `guards.md`
- **Por que cuarto:** Introduce `runInInjectionContext`, patron que se reutiliza identicamente en resolvers.
- **Aprende:**
  - `TestBed.runInInjectionContext(() => miGuard(route, state))` para ejecutar funciones con `inject()`
  - Mock de `ActivatedRouteSnapshot` con solo las propiedades que necesitas
  - Verificar `UrlTree`: `expect(result).toBeInstanceOf(UrlTree)` + `.toString()`
  - `provideRouter([])` para tener Router disponible sin rutas reales

#### 5. `resolvers/`
- **Archivo:** `product-detail.resolver.ts` — resolver funcional (ResolveFn) que pre-carga producto por ID de URL
- **Test:** `product-detail.resolver.spec.ts`
- **Doc:** `resolvers.md`
- **Por que quinto:** Consolida el patron de guards. La diferencia es que retorna datos, no boolean/UrlTree.
- **Aprende:**
  - Mismo `runInInjectionContext` que guards
  - Mock de `paramMap`: `{ get: (key) => params[key] ?? null }`
  - Combinar `runInInjectionContext` + `HttpTestingController` en el mismo test
  - `EMPTY` de RxJS: Observable que completa sin emitir (cancela la navegacion)
  - `jest.spyOn(router, 'navigate')` para verificar redirecciones sin hacer navegacion real

---

### Intermedio-Avanzado

#### 6. `interceptors/`
- **Archivo:** `auth-token.interceptor.ts` — interceptor funcional que agrega JWT y maneja errores 401
- **Test:** `auth-token.interceptor.spec.ts`
- **Doc:** `interceptors.md`
- **Por que sexto:** Combina el patron HTTP (de services) con funciones que usan inject (de guards). Requiere entender `withInterceptors`.
- **Aprende:**
  - `provideHttpClient(withFetch(), withInterceptors([miInterceptor]))` en TestBed
  - El interceptor se activa automaticamente en TODAS las peticiones del test
  - Verificar headers en la request interceptada: `req.request.headers.get('Authorization')`
  - `.catch((err) => err)` en `firstValueFrom` cuando esperas un error
  - Diferencia entre error 401 (manejo especial) y otros errores (propagacion normal)

---

### Avanzado

#### 7. `directives/`
- **Archivo:** `highlight.directive.ts` — directiva de atributo con hover (mouseenter/mouseleave)
- **Test:** `highlight.directive.spec.ts`
- **Doc:** `directives.md`
- **Por que septimo:** Introduce el patron "host component" que es unico para directivas.
- **Aprende:**
  - Por que las directivas necesitan un componente anfitrion (host component)
  - Crear un `@Component` minimo solo para el test
  - `userEvent.hover(element)` y `userEvent.unhover(element)` para simular mouse
  - Verificar estilos inline: `element.style.backgroundColor`

#### 8. `components/`
- **Archivo:** `product-card.component.ts` — tarjeta de producto con signals, inputs, outputs, servicio
- **Template:** `product-card.component.html` — usa `@if`, `@switch`, `@for`
- **Test:** `product-card.component.spec.ts`
- **Doc:** `components.md`
- **Por que ultimo:** Integra TODOS los conceptos anteriores en un solo test.
- **Aprende:**
  - `componentInputs` en `render()` para pasar signal inputs (`input()`, `input.required()`)
  - `fixture.componentInstance.addToCart.subscribe(spy)` para testear signal outputs
  - Testing Library queries: `getByText`, `getByTestId`, `queryByTestId`
  - `toHaveTextContent()`, `toBeInTheDocument()`, `not.toBeInTheDocument()`
  - `userEvent.click()` para interacciones
  - Mock de servicio con `{ provide: FavoritesService, useValue: mockObj }`
  - Helper `renderComponent()` para evitar repeticion en tests

---

## Resumen de herramientas por nivel

### Sin TestBed (Basico)
```typescript
const pipe = new MiPipe();          // Instanciacion directa
const validator = miValidator();    // Funcion de fabrica
const result = pipe.transform(...)  // Llamada directa
expect(result).toBe(...)
```

### Con TestBed + HttpTestingController (Intermedio)
```typescript
TestBed.configureTestingModule({
  providers: [provideHttpClient(withFetch()), provideHttpClientTesting(), MiServicio],
});
const req = httpTesting.expectOne('/api/endpoint');
req.flush(mockData);
```

### Con TestBed + runInInjectionContext (Intermedio)
```typescript
TestBed.configureTestingModule({ providers: [provideRouter([]), MiServicio] });
const result = TestBed.runInInjectionContext(() => miGuard(route, state));
```

### Con Testing Library (Avanzado)
```typescript
await render(MiComponente, {
  componentInputs: { name: 'valor' },
  providers: [{ provide: MiServicio, useValue: mockObj }],
});
await userEvent.click(screen.getByRole('button'));
expect(screen.getByText('resultado')).toBeInTheDocument();
```

---

## Comandos para ejecutar tests por seccion

```bash
# Todos los tests
pnpm test

# Solo una seccion
pnpm test -- --testPathPattern="truncate.pipe"
pnpm test -- --testPathPattern="password-strength"
pnpm test -- --testPathPattern="product.service"
pnpm test -- --testPathPattern="auth.guard"
pnpm test -- --testPathPattern="product-detail.resolver"
pnpm test -- --testPathPattern="auth-token.interceptor"
pnpm test -- --testPathPattern="highlight.directive"
pnpm test -- --testPathPattern="product-card"

# Con cobertura
pnpm test:coverage
```

---

## Documentacion de referencia

- `unit-testing-guide.md` — Filosofia general: que son los unit tests, por que mockeamos, patron Given-When-Then, piramide de testing
- Cada carpeta tiene su propio `.md` con casos de uso, instrucciones y explicacion del test
