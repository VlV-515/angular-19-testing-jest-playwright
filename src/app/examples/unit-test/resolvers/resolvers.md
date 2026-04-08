# Unit Test: Resolvers

## Que es un Resolver en Angular?

Un **resolver** pre-carga datos ANTES de que una ruta se active. Esto garantiza que
el componente tenga los datos disponibles inmediatamente cuando se renderiza,
sin necesidad de mostrar un spinner de carga.

### Flujo sin Resolver

```
1. Usuario navega a /products/42
2. Angular activa la ruta y renderiza el componente
3. El componente hace ngOnInit() -> llama al servicio -> loading...
4. Mientras carga, el usuario ve un spinner o contenido vacio
5. Los datos llegan y se muestran
```

### Flujo con Resolver

```
1. Usuario navega a /products/42
2. Angular ejecuta el resolver ANTES de activar la ruta
3. El resolver carga los datos del producto
4. Cuando los datos estan listos, Angular activa la ruta
5. El componente ya tiene los datos disponibles inmediatamente
```

## Archivo: product-detail.resolver.ts

### Que hace?

Resolver funcional que:
1. Lee el parametro `:id` de la URL
2. Valida que sea numerico
3. Hace un GET al API para obtener el producto
4. Si falla, redirige a `/not-found`

### Configuracion en rutas

```typescript
const routes: Routes = [
  {
    path: 'products/:id',
    resolve: { product: productDetailResolver },
    component: ProductDetailComponent,
  },
];
```

### Acceso a datos en el componente

```typescript
@Component({ ... })
export class ProductDetailComponent {
  private route = inject(ActivatedRoute);
  product = this.route.snapshot.data['product']; // Datos pre-cargados
}
```

### EMPTY de RxJS

```typescript
return EMPTY; // Observable que completa inmediatamente sin emitir valores
```

`EMPTY` se usa para cancelar la navegacion. Cuando el resolver retorna un
Observable que completa sin emitir, Angular no activa la ruta.

## Archivo: product-detail.resolver.spec.ts

### Estructura del test

```
describe('productDetailResolver')
  beforeEach -> TestBed con Router + HttpClient + HttpTestingController
  afterEach -> httpTesting.verify()

  it -> ID valido -> retorna producto
  it -> ID ausente -> redirige a /products
  it -> ID no numerico -> redirige a /products
  it -> Error del API -> redirige a /not-found
```

### Conceptos clave del test

#### 1. Mismo patron que guards

```typescript
const result$ = TestBed.runInInjectionContext(() =>
  productDetailResolver(route, mockState),
);
```

Igual que los guards, los resolvers funcionales usan `inject()` y necesitan
`runInInjectionContext()` para ejecutarse en tests.

#### 2. Mock de paramMap

```typescript
const createMockRoute = (params: Record<string, string>): ActivatedRouteSnapshot => {
  return {
    paramMap: {
      get: (key: string) => params[key] ?? null,
    },
  } as unknown as ActivatedRouteSnapshot;
};
```

El resolver lee `route.paramMap.get('id')`. Mockeamos solo esa parte del snapshot.

#### 3. Combinar runInInjectionContext + HttpTestingController

El resolver usa `inject(ProductApiService)` que a su vez usa `inject(HttpClient)`.
Necesitamos tanto el contexto de inyeccion como el HttpTestingController:

```typescript
const result$ = TestBed.runInInjectionContext(() =>
  productDetailResolver(route, mockState),
);
const resultPromise = firstValueFrom(result$);
const req = httpTesting.expectOne('/api/products/42');
req.flush(mockProduct);
const result = await resultPromise;
```

#### 4. `jest.spyOn` para verificar navegacion

```typescript
jest.spyOn(router, 'navigate');
// ... ejecutar resolver ...
expect(router.navigate).toHaveBeenCalledWith(['/not-found']);
```

Usamos `spyOn` para verificar que el resolver llamo a `router.navigate`
con los argumentos correctos, sin hacer navegacion real.

#### 5. Diferencia con guards: retorno de datos

| Aspecto | Guard | Resolver |
|---------|-------|----------|
| Retorna | `boolean \| UrlTree` | `Observable<T>` con datos |
| Proposito | Permitir/denegar acceso | Pre-cargar datos |
| Test verifica | `true`, `UrlTree` | Datos del Observable |

## Ejecutar los tests

```bash
pnpm test -- --testPathPattern="product-detail.resolver"
```
