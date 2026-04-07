import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { Product, ProductService } from './product.service';

//?
//? SERVICIOS: Aqui es donde TestBed brilla. Necesitamos configurar el entorno de
//? inyeccion de dependencias de Angular para que HttpClient funcione.
//? HttpTestingController nos permite interceptar y simular las peticiones HTTP.
//?

describe('ProductService', () => {
  let service: ProductService;
  let httpTesting: HttpTestingController;

  //? Datos de prueba reutilizables
  const mockProducts: Product[] = [
    { id: 1, name: 'Laptop', price: 999, category: 'electronics', active: true },
    { id: 2, name: 'Camiseta', price: 25, category: 'clothing', active: true },
    { id: 3, name: 'Monitor', price: 450, category: 'electronics', active: false },
  ];

  beforeEach(() => {
    //?
    //? TestBed.configureTestingModule crea un mini modulo de Angular solo para este test.
    //? provideHttpClient(withFetch()) -> Registra HttpClient para que el servicio pueda usarlo
    //? provideHttpClientTesting() -> Reemplaza el HttpClient real por uno de testing que NO hace peticiones reales
    //? ProductService -> El servicio que queremos probar
    //?
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withFetch()),
        provideHttpClientTesting(),
        ProductService,
      ],
    });

    service = TestBed.inject(ProductService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  //?
  //? afterEach con verify() es CRITICO para servicios con HTTP.
  //? Verifica que no haya peticiones HTTP que se hicieron pero no se resolvieron.
  //? Si olvidaste hacer flush() en alguna peticion, este verify() te avisara.
  //?
  afterEach(() => {
    httpTesting.verify();
  });

  // ─────────────────────────────────────────────
  // GET /api/products - Obtener todos
  // ─────────────────────────────────────────────

  it('should fetch all products and update the products signal', async () => {
    //! Given
    const productsPromise = firstValueFrom(service.getAll()); //? Convertimos Observable -> Promise

    //! When - Interceptamos la peticion y simulamos la respuesta
    const req = httpTesting.expectOne('/api/products');
    req.flush(mockProducts); //? Simulamos que el servidor responde con mockProducts

    //! Then
    const result = await productsPromise;
    expect(result).toEqual(mockProducts);
    expect(req.request.method).toBe('GET');
    expect(service.products()).toEqual(mockProducts); //? El signal se actualizo
  });

  // ─────────────────────────────────────────────
  // GET /api/products/:id - Obtener por ID
  // ─────────────────────────────────────────────

  it('should fetch a product by id', async () => {
    //! Given
    const expectedProduct = mockProducts[0];
    const productPromise = firstValueFrom(service.getById(1));

    //! When
    const req = httpTesting.expectOne('/api/products/1'); //? La URL incluye el ID
    req.flush(expectedProduct);

    //! Then
    const result = await productPromise;
    expect(result).toEqual(expectedProduct);
    expect(req.request.method).toBe('GET');
  });

  // ─────────────────────────────────────────────
  // POST /api/products - Crear producto
  // ─────────────────────────────────────────────

  it('should create a new product', async () => {
    //! Given
    const newProduct = { name: 'Teclado', price: 75, category: 'electronics', active: true };
    const createdProduct = { ...newProduct, id: 4 };
    const createPromise = firstValueFrom(service.create(newProduct));

    //! When
    const req = httpTesting.expectOne('/api/products');
    req.flush(createdProduct);

    //! Then
    expect(req.request.method).toBe('POST'); //? Verificamos que sea POST, no GET
    expect(req.request.body).toEqual(newProduct); //? Verificamos el body enviado
    expect(await createPromise).toEqual(createdProduct);
  });

  // ─────────────────────────────────────────────
  // PUT /api/products/:id - Actualizar producto
  // ─────────────────────────────────────────────

  it('should update an existing product', async () => {
    //! Given
    const changes = { price: 899 };
    const updatedProduct = { ...mockProducts[0], ...changes };
    const updatePromise = firstValueFrom(service.update(1, changes));

    //! When
    const req = httpTesting.expectOne('/api/products/1');
    req.flush(updatedProduct);

    //! Then
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(changes);
    expect(await updatePromise).toEqual(updatedProduct);
  });

  // ─────────────────────────────────────────────
  // DELETE /api/products/:id - Eliminar producto
  // ─────────────────────────────────────────────

  it('should delete a product', async () => {
    //! Given
    const deletePromise = firstValueFrom(service.delete(1));

    //! When
    const req = httpTesting.expectOne('/api/products/1');
    req.flush(null); //? DELETE no retorna body, simulamos con null

    //! Then
    expect(req.request.method).toBe('DELETE');
    await deletePromise; //? Verificamos que no lance error
  });

  // ─────────────────────────────────────────────
  // GET /api/products?name=query - Buscar por nombre
  // ─────────────────────────────────────────────

  it('should search products by name using query params', async () => {
    //! Given
    const searchResults = [mockProducts[0]];
    const searchPromise = firstValueFrom(service.searchByName('Laptop'));

    //! When
    const req = httpTesting.expectOne('/api/products?name=Laptop'); //? URL con query params
    req.flush(searchResults);

    //! Then
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('name')).toBe('Laptop'); //? Verificamos el query param
    expect(await searchPromise).toEqual(searchResults);
  });

  // ─────────────────────────────────────────────
  // Signal de loading
  // ─────────────────────────────────────────────

  it('should set loading to true during request and false after completion', async () => {
    //! Given - Loading empieza en false
    expect(service.loading()).toBe(false);

    //! When - Iniciamos la peticion (pero no la resolvemos aun)
    const productsPromise = firstValueFrom(service.getAll());

    //? En este punto la peticion fue enviada pero no resuelta
    //? loading deberia ser true
    expect(service.loading()).toBe(true);

    //? Ahora resolvemos la peticion
    const req = httpTesting.expectOne('/api/products');
    req.flush(mockProducts);
    await productsPromise;

    //! Then - Loading vuelve a false despues de completar
    expect(service.loading()).toBe(false);
  });

  it('should set loading to false even when request fails', async () => {
    //! Given
    expect(service.loading()).toBe(false);
    const productsPromise = firstValueFrom(service.getAll()).catch(() => null);
    expect(service.loading()).toBe(true);

    //! When - Simulamos un error 500 del servidor
    const req = httpTesting.expectOne('/api/products');
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    await productsPromise;

    //! Then - Loading es false aunque haya fallado (gracias a finalize())
    expect(service.loading()).toBe(false);
  });

  // ─────────────────────────────────────────────
  // Filtro local (sin HTTP)
  // ─────────────────────────────────────────────

  it('should return only active products from getActiveProducts()', async () => {
    //! Given - Primero cargamos productos para llenar el signal
    const productsPromise = firstValueFrom(service.getAll());
    const req = httpTesting.expectOne('/api/products');
    req.flush(mockProducts);
    await productsPromise;

    //! When - Filtramos los activos (esto es logica local, no HTTP)
    const activeProducts = service.getActiveProducts();

    //! Then - Solo los productos con active: true
    expect(activeProducts).toHaveLength(2);
    expect(activeProducts.every((p) => p.active)).toBe(true);
    expect(activeProducts.map((p) => p.name)).toEqual(['Laptop', 'Camiseta']);
  });
});
