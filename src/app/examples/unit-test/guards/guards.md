# Unit Test: Guards

## Que es un Guard en Angular?

Un **guard** protege rutas de navegacion. Decide si un usuario puede o no acceder
a una ruta especifica. Los guards mas comunes son:

| Guard | Proposito |
|-------|-----------|
| `canActivate` | Puede el usuario acceder a esta ruta? |
| `canDeactivate` | Puede el usuario salir de esta ruta? |
| `canMatch` | Debe Angular considerar esta ruta? |

## Guards funcionales vs Class-based (Angular 19)

En Angular 19, los guards son **funciones**, no clases:

```typescript
// Angular 19 (funcional) - MODERNO
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthStateService);
  return auth.isAuthenticated();
};

// Antes (class-based) - LEGACY, no usar
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(route, state) { ... }
}
```

## Archivo: auth.guard.ts

### Que hace?

Guard que protege rutas verificando:
1. Si el usuario esta autenticado
2. Si tiene el rol requerido (configurado en `route.data`)

### Flujo de decision

```
Usuario intenta acceder a ruta protegida
  |
  ├── No autenticado? → Redirige a /login
  |
  ├── Autenticado pero sin el rol requerido? → Redirige a /forbidden
  |
  └── Autenticado con el rol correcto? → Permite acceso (true)
```

### Configuracion en rutas

```typescript
const routes: Routes = [
  {
    path: 'admin',
    canActivate: [authGuard],
    data: { requiredRole: 'admin' },  // El guard lee esto
    component: AdminComponent,
  },
  {
    path: 'profile',
    canActivate: [authGuard],  // Sin requiredRole, solo verifica autenticacion
    component: ProfileComponent,
  },
];
```

### AuthStateService (servicio auxiliar)

El guard depende de `AuthStateService` que maneja el estado de sesion:

| Metodo | Retorna | Proposito |
|--------|---------|-----------|
| `isAuthenticated()` | `boolean` | Hay sesion activa? |
| `hasRole(role)` | `boolean` | El usuario tiene este rol? |
| `setSession(loggedIn, roles)` | `void` | Configurar estado (para tests) |

## Archivo: auth.guard.spec.ts

### Estructura del test

```
describe('authGuard')
  beforeEach -> TestBed con provideRouter + AuthStateService
  it -> autenticado + rol correcto -> true
  it -> no autenticado -> UrlTree /login
  it -> autenticado sin rol -> UrlTree /forbidden
  it -> autenticado sin requiredRole en data -> true
  it -> no autenticado aunque tenga roles -> UrlTree /login
```

### Conceptos clave del test

#### 1. `TestBed.runInInjectionContext()`

```typescript
const result = TestBed.runInInjectionContext(() => authGuard(route, state));
```

Los guards funcionales usan `inject()` internamente. `inject()` solo funciona
dentro de un "contexto de inyeccion" de Angular. `runInInjectionContext()`
crea ese contexto para que el guard pueda usar `inject()` en el test.

**Sin esto:** `inject()` lanzaria un error "inject() must be called from an injection context"

#### 2. Mock de ActivatedRouteSnapshot

```typescript
const createMockRoute = (data: Record<string, unknown> = {}): ActivatedRouteSnapshot => {
  return { data } as ActivatedRouteSnapshot;
};
```

No necesitamos crear un ActivatedRouteSnapshot completo. Solo mockeamos
las propiedades que nuestro guard realmente usa (`data`).

#### 3. `provideRouter([])`

```typescript
TestBed.configureTestingModule({
  providers: [
    provideRouter([]),  // Router vacio, solo necesitamos createUrlTree()
    AuthStateService,
  ],
});
```

El guard usa `router.createUrlTree()` para redirigir. Necesitamos que
Router este disponible, pero no necesitamos rutas reales.

#### 4. Verificar UrlTree

```typescript
expect(result).toBeInstanceOf(UrlTree);
expect((result as UrlTree).toString()).toBe('/login');
```

Cuando un guard redirige, retorna un `UrlTree` (no `false`).
Convertimos el UrlTree a string para verificar la ruta destino.

#### 5. Configurar estado antes de cada test

```typescript
authState.setSession(true, ['admin']);  // Simula usuario logueado con rol admin
authState.setSession(false, []);       // Simula usuario no autenticado
```

Cada test configura el estado de autenticacion que necesita.
`beforeEach` no establece un estado por defecto para que cada test sea explicito.

## Ejecutar los tests

```bash
npm run test -- --testPathPattern="auth.guard"
```
