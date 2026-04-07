import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { Product, ProductApiService, productDetailResolver } from './product-detail.resolver';

//?
//? RESOLVERS FUNCIONALES: Usan el mismo patron que los guards.
//? La diferencia principal es que los resolvers RETORNAN DATOS (no boolean/UrlTree).
//? Se ejecutan ANTES de que el componente se renderice.
//?
//? Usamos el mismo TestBed.runInInjectionContext() que en guards.
//?

describe('productDetailResolver', () => {
  let httpTesting: HttpTestingController;
  let router: Router;

  //? Helper para crear un mock de ActivatedRouteSnapshot con paramMap
  const createMockRoute = (params: Record<string, string>): ActivatedRouteSnapshot => {
    return {
      paramMap: {
        get: (key: string) => params[key] ?? null,
        has: (key: string) => key in params,
      },
    } as unknown as ActivatedRouteSnapshot;
  };

  const mockState = {} as RouterStateSnapshot;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withFetch()),
        provideHttpClientTesting(),
        ProductApiService,
      ],
    });

    httpTesting = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);

    //? Espiamos router.navigate para verificar redirecciones
    jest.spyOn(router, 'navigate');
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should resolve product data when valid id is provided', async () => {
    //! Given
    const mockProduct: Product = { id: 42, name: 'Laptop', price: 999 };
    const route = createMockRoute({ id: '42' });

    //! When - Ejecutamos el resolver en el contexto de inyeccion
    const result$ = TestBed.runInInjectionContext(() =>
      productDetailResolver(route, mockState),
    );

    //? El resolver retorna un Observable, lo convertimos a Promise
    const resultPromise = firstValueFrom(result$ as any);

    //? Interceptamos la peticion HTTP que el resolver hace internamente
    const req = httpTesting.expectOne('/api/products/42');
    req.flush(mockProduct);

    //! Then
    const result = await resultPromise;
    expect(result).toEqual(mockProduct);
    expect(req.request.method).toBe('GET');
  });

  it('should redirect to /products when id is missing', () => {
    //! Given - Ruta sin parametro 'id'
    const route = createMockRoute({});

    //! When
    TestBed.runInInjectionContext(() => productDetailResolver(route, mockState));

    //! Then
    expect(router.navigate).toHaveBeenCalledWith(['/products']);
  });

  it('should redirect to /products when id is not numeric', () => {
    //! Given - ID no numerico
    const route = createMockRoute({ id: 'abc' });

    //! When
    TestBed.runInInjectionContext(() => productDetailResolver(route, mockState));

    //! Then
    expect(router.navigate).toHaveBeenCalledWith(['/products']);
  });

  it('should redirect to /not-found when product API returns error', async () => {
    //! Given
    const route = createMockRoute({ id: '99' });

    //! When
    const result$ = TestBed.runInInjectionContext(() =>
      productDetailResolver(route, mockState),
    );

    //? Nos suscribimos al Observable (aunque EMPTY no emitira valores)
    const values: any[] = [];
    (result$ as any).subscribe({
      next: (v: any) => values.push(v),
    });

    //? Simulamos un error 404 del servidor
    const req = httpTesting.expectOne('/api/products/99');
    req.flush('Not Found', { status: 404, statusText: 'Not Found' });

    //! Then
    expect(router.navigate).toHaveBeenCalledWith(['/not-found']);
    expect(values).toHaveLength(0); //? EMPTY no emite valores
  });
});
