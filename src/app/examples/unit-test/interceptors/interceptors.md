# Unit Test: Interceptors

## Que es un Interceptor en Angular?

Un **interceptor** es un middleware que se ejecuta en CADA peticion HTTP.
Puede modificar la peticion antes de enviarla y/o manejar la respuesta/error.

### Casos de uso comunes

| Caso | Que hace |
|------|----------|
| Autenticacion | Agrega token JWT a los headers |
| Logging | Registra todas las peticiones en un log |
| Loading | Muestra/oculta spinner global de carga |
| Errores | Manejo centralizado de errores HTTP |
| Cache | Cachea respuestas para evitar peticiones repetidas |
| Retry | Reintenta peticiones fallidas automaticamente |

## Interceptors funcionales vs Class-based (Angular 19)

```typescript
// Angular 19 (funcional) - MODERNO
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(TokenService).getToken();
  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};

// Antes (class-based) - LEGACY
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req, next) { ... }
}
```

## Archivo: auth-token.interceptor.ts

### Que hace?

1. **Agrega el header Authorization** con el token JWT a peticiones internas (`/api`)
2. **Maneja errores 401**: limpia el token y redirige a `/login`
3. **No modifica** peticiones a URLs externas

### Flujo del interceptor

```
Peticion HTTP sale del servicio
  |
  ├── URL empieza con /api Y hay token?
  |     └── SI: Clona request y agrega header Authorization: Bearer <token>
  |     └── NO: Pasa la request original sin modificar
  |
  ├── La request se envia al servidor
  |
  └── La respuesta llega
        ├── Status 401?
        |     └── Limpia token + redirige a /login
        └── Otro error o exito?
              └── Pasa sin modificar
```

### Por que clone()?

```typescript
req = req.clone({
  setHeaders: { Authorization: `Bearer ${token}` },
});
```

Las peticiones HTTP en Angular son **inmutables**. No puedes hacer `req.headers.set(...)`.
Debes clonar la request con los cambios que necesitas.

### Registro del interceptor

```typescript
// En app.config.ts o providers
provideHttpClient(
  withFetch(),
  withInterceptors([authTokenInterceptor])  // Aqui se registra
)
```

## Archivo: auth-token.interceptor.spec.ts

### Estructura del test

```
describe('authTokenInterceptor')
  beforeEach -> TestBed con withInterceptors([authTokenInterceptor])
  afterEach -> httpTesting.verify()

  it -> con token + URL /api -> agrega header Authorization
  it -> sin token -> no agrega header
  it -> con token + URL externa -> no agrega header
  it -> respuesta 401 -> redirige a /login
  it -> respuesta 401 -> limpia el token
  it -> respuesta 500 -> no redirige (solo propaga error)
```

### Conceptos clave del test

#### 1. Registrar el interceptor en TestBed

```typescript
TestBed.configureTestingModule({
  providers: [
    provideHttpClient(
      withFetch(),
      withInterceptors([authTokenInterceptor])  // El interceptor esta activo
    ),
    provideHttpClientTesting(),
  ],
});
```

`withInterceptors([authTokenInterceptor])` registra el interceptor para que
TODAS las peticiones HTTP del test pasen por el.

#### 2. Verificar headers modificados

```typescript
const req = httpTesting.expectOne('/api/data');
expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-token-123');
```

`expectOne()` nos da acceso a la request interceptada. Podemos verificar
que el interceptor agrego los headers correctos.

#### 3. El test no llama al interceptor directamente

A diferencia de guards/resolvers donde llamamos `authGuard(route, state)`,
con interceptors **no llamamos al interceptor directamente**. En su lugar:

1. Hacemos una peticion HTTP normal: `http.get('/api/data')`
2. El interceptor se ejecuta automaticamente (porque lo registramos con `withInterceptors`)
3. Verificamos el resultado con `httpTesting.expectOne()`

#### 4. Simular errores HTTP

```typescript
const req = httpTesting.expectOne('/api/data');
req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
```

`flush()` con segundo parametro permite simular respuestas con error.
El interceptor atrapa el error 401 y ejecuta su logica de redireccion.

#### 5. `.catch()` en firstValueFrom para errores esperados

```typescript
const dataPromise = firstValueFrom(http.get('/api/data')).catch((err) => err);
```

Cuando esperamos un error, agregamos `.catch()` para que la Promise no lance
una excepcion sin manejar. El error se captura y podemos inspeccionarlo.

## Ejecutar los tests

```bash
npm run test -- --testPathPattern="auth-token.interceptor"
```
