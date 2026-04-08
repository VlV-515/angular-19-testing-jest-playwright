# Unit Test: Services

## Que es un Service en Angular?

Un **service** es una clase inyectable que encapsula logica de negocio, acceso a datos,
o funcionalidad compartida entre componentes. Es el lugar ideal para:

- Hacer peticiones HTTP (API calls)
- Manejar estado de la aplicacion
- Logica de negocio reutilizable

## Por que los Services necesitan TestBed?

A diferencia de las pipes, los servicios usan **inyeccion de dependencias**:
- `inject(HttpClient)` necesita que Angular provea HttpClient
- `inject(Router)` necesita que Angular provea Router

TestBed crea un entorno de Angular minimo donde estas dependencias estan disponibles.

## Archivo: product.service.ts

### Que hace?

Servicio CRUD (Create, Read, Update, Delete) de productos que:

| Metodo | HTTP | URL | Funcion |
|--------|------|-----|---------|
| `getAll()` | GET | `/api/products` | Obtiene todos los productos |
| `getById(id)` | GET | `/api/products/:id` | Obtiene un producto por ID |
| `create(product)` | POST | `/api/products` | Crea un nuevo producto |
| `update(id, changes)` | PUT | `/api/products/:id` | Actualiza un producto |
| `delete(id)` | DELETE | `/api/products/:id` | Elimina un producto |
| `searchByName(query)` | GET | `/api/products?name=query` | Busca por nombre |
| `getActiveProducts()` | - | - | Filtro local (sin HTTP) |

### Manejo de estado con Signals

```typescript
private _products = signal<Product[]>([]);    // Estado privado (solo el servicio lo modifica)
public products = this._products.asReadonly(); // Lectura publica para componentes

private _loading = signal(false);
public loading = this._loading.asReadonly();
```

Los signals permiten que los componentes "reaccionen" automaticamente cuando los datos cambian.
El signal `loading` indica si hay una peticion HTTP en curso.

### Operadores RxJS utilizados

| Operador | Proposito |
|----------|-----------|
| `tap()` | Ejecutar efecto secundario (actualizar signal) sin modificar el flujo |
| `finalize()` | Ejecutar codigo cuando el Observable completa o tiene error |
| `catchError()` | Manejar errores sin romper el flujo |

## Archivo: product.service.spec.ts

### Estructura del test

```
describe('ProductService')
  beforeEach -> Configura TestBed con HttpClient + HttpTestingController
  afterEach -> httpTesting.verify()

  it -> GET /api/products (getAll + signal actualizado)
  it -> GET /api/products/:id (getById)
  it -> POST /api/products (create + verificar body)
  it -> PUT /api/products/:id (update + verificar body)
  it -> DELETE /api/products/:id (delete)
  it -> GET /api/products?name=query (searchByName + query params)
  it -> loading signal true durante request, false despues
  it -> loading signal false incluso cuando falla (finalize)
  it -> getActiveProducts filtra localmente
```

### Conceptos clave del test

#### 1. Configuracion del TestBed

```typescript
TestBed.configureTestingModule({
  providers: [
    provideHttpClient(withFetch()),    // Registra HttpClient
    provideHttpClientTesting(),         // Lo reemplaza por version de testing
    ProductService,                     // El servicio a probar
  ],
});

service = TestBed.inject(ProductService);
httpTesting = TestBed.inject(HttpTestingController);
```

- `provideHttpClient(withFetch())` -> Hace que HttpClient este disponible
- `provideHttpClientTesting()` -> Reemplaza el HttpClient real por uno que NO hace peticiones reales
- `HttpTestingController` -> Nos permite interceptar las peticiones y simular respuestas

#### 2. El flujo de una prueba HTTP

```typescript
// 1. Ejecutamos el metodo que hace la peticion
const promise = firstValueFrom(service.getAll());

// 2. Interceptamos la peticion (aun no se resolvio)
const req = httpTesting.expectOne('/api/products');

// 3. Verificamos los detalles de la peticion
expect(req.request.method).toBe('GET');

// 4. Simulamos la respuesta del servidor
req.flush(mockProducts);

// 5. Verificamos el resultado
const result = await promise;
expect(result).toEqual(mockProducts);
```

#### 3. `firstValueFrom()` — Observable a Promise

```typescript
const result = await firstValueFrom(service.getAll());
```

Los metodos del servicio retornan Observables, pero en los tests es mas comodo
trabajar con Promises (para usar `await`). `firstValueFrom()` convierte el
Observable a una Promise que se resuelve con el primer valor emitido.

#### 4. `expectOne()` — Interceptar una peticion

```typescript
const req = httpTesting.expectOne('/api/products');
```

`expectOne` verifica que se hizo EXACTAMENTE una peticion a esa URL.
Si se hicieron 0 o 2+, el test falla automaticamente.

#### 5. `flush()` — Simular respuesta

```typescript
req.flush(mockProducts);  // Respuesta exitosa con datos
req.flush('Error', { status: 500, statusText: 'Internal Server Error' }); // Error HTTP
req.flush(null);  // Sin body (para DELETE)
```

`flush()` simula que el servidor respondio. Puedes pasar datos para exito
o un status code para simular errores.

#### 6. `verify()` — Red de seguridad

```typescript
afterEach(() => {
  httpTesting.verify();
});
```

Se ejecuta despues de CADA test. Verifica que no haya peticiones HTTP
que se hicieron pero nunca se resolvieron con `flush()`. Es tu red de seguridad.

#### 7. Testear signals

```typescript
expect(service.loading()).toBe(false);  // Antes de la peticion
service.getAll();
expect(service.loading()).toBe(true);   // Durante la peticion
// ... flush ...
expect(service.loading()).toBe(false);  // Despues de la peticion
```

Los signals se leen como funciones: `signal()` retorna su valor actual.

## Ejecutar los tests

```bash
pnpm test -- --testPathPattern="product.service"
```
