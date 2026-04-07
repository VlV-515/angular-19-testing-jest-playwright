import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { authTokenInterceptor, TokenStorageService } from './auth-token.interceptor';

//?
//? INTERCEPTORS FUNCIONALES: Combinan los conceptos de:
//? - HttpTestingController (de services) para verificar peticiones y headers
//? - inject() dentro de funciones (como guards/resolvers)
//?
//? La clave es registrar el interceptor con withInterceptors() en el TestBed.
//? Asi, TODAS las peticiones HTTP pasaran por el interceptor automaticamente.
//?

describe('authTokenInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let tokenStorage: TokenStorageService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        //?
        //? withInterceptors([authTokenInterceptor]) es la clave:
        //? Registra nuestro interceptor para que procese todas las peticiones HTTP
        //?
        provideHttpClient(withFetch(), withInterceptors([authTokenInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        TokenStorageService,
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    tokenStorage = TestBed.inject(TokenStorageService);
    router = TestBed.inject(Router);

    jest.spyOn(router, 'navigate');
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should add Authorization header when token exists', async () => {
    //! Given - Hay un token almacenado
    tokenStorage.setToken('jwt-token-123');
    const dataPromise = firstValueFrom(http.get('/api/data'));

    //! When - Se hace una peticion a /api
    const req = httpTesting.expectOne('/api/data');

    //! Then - El interceptor agrego el header Authorization
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-token-123');

    req.flush({ data: 'ok' });
    await dataPromise;
  });

  it('should not add Authorization header when token is null', async () => {
    //! Given - No hay token
    const dataPromise = firstValueFrom(http.get('/api/data'));

    //! When
    const req = httpTesting.expectOne('/api/data');

    //! Then - No deberia haber header Authorization
    expect(req.request.headers.has('Authorization')).toBe(false);

    req.flush({ data: 'ok' });
    await dataPromise;
  });

  it('should not add Authorization header for external URLs', async () => {
    //! Given - Hay token, pero la peticion es a una URL externa
    tokenStorage.setToken('jwt-token-123');
    const dataPromise = firstValueFrom(http.get('https://external-api.com/data'));

    //! When
    const req = httpTesting.expectOne('https://external-api.com/data');

    //! Then - No agrega el token a URLs externas (solo a /api)
    expect(req.request.headers.has('Authorization')).toBe(false);

    req.flush({ data: 'external' });
    await dataPromise;
  });

  it('should redirect to /login on 401 response', async () => {
    //! Given
    tokenStorage.setToken('expired-token');
    const dataPromise = firstValueFrom(http.get('/api/data')).catch((err) => err);

    //! When - El servidor responde con 401
    const req = httpTesting.expectOne('/api/data');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    await dataPromise;

    //! Then - El interceptor redirige a /login
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should clear token on 401 response', async () => {
    //! Given
    tokenStorage.setToken('expired-token');
    const clearSpy = jest.spyOn(tokenStorage, 'clearToken');
    const dataPromise = firstValueFrom(http.get('/api/data')).catch((err) => err);

    //! When
    const req = httpTesting.expectOne('/api/data');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    await dataPromise;

    //! Then - El token fue limpiado
    expect(clearSpy).toHaveBeenCalled();
    expect(tokenStorage.getToken()).toBeNull();
  });

  it('should not redirect on non-401 errors', async () => {
    //! Given
    tokenStorage.setToken('valid-token');
    const dataPromise = firstValueFrom(http.get('/api/data')).catch((err) => err);

    //! When - Error 500 (no es 401)
    const req = httpTesting.expectOne('/api/data');
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    await dataPromise;

    //! Then - No redirige, solo propaga el error
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
