import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { authGuard, AuthStateService } from './auth.guard';

//?
//? GUARDS FUNCIONALES: En Angular 19, los guards son funciones que usan inject().
//? Para testearlos necesitamos:
//? 1. TestBed para proveer los servicios que el guard inyecta
//? 2. runInInjectionContext() para ejecutar la funcion dentro del contexto de Angular
//? 3. Mocks de ActivatedRouteSnapshot para simular la ruta
//?

describe('authGuard', () => {
  let authState: AuthStateService;
  let router: Router;

  //? Creamos un mock de ActivatedRouteSnapshot
  //? Solo necesitamos la propiedad 'data' que es donde se configura el 'requiredRole'
  const createMockRoute = (data: Record<string, unknown> = {}): ActivatedRouteSnapshot => {
    return { data } as ActivatedRouteSnapshot;
  };

  //? Mock de RouterStateSnapshot (el guard no lo usa, pero la firma lo requiere)
  const mockState = {} as RouterStateSnapshot;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]), //? Provee el Router (necesario para createUrlTree)
        AuthStateService,
      ],
    });

    authState = TestBed.inject(AuthStateService);
    router = TestBed.inject(Router);
  });

  it('should allow access when user is authenticated and has the required role', () => {
    //! Given - Usuario autenticado con rol 'admin'
    authState.setSession(true, ['admin']);
    const route = createMockRoute({ requiredRole: 'admin' });

    //! When - Ejecutamos el guard dentro del contexto de inyeccion de Angular
    const result = TestBed.runInInjectionContext(() => authGuard(route, mockState));

    //! Then - Retorna true (permite el acceso)
    expect(result).toBe(true);
  });

  it('should redirect to /login when user is not authenticated', () => {
    //! Given - Usuario NO autenticado
    authState.setSession(false, []);
    const route = createMockRoute({ requiredRole: 'admin' });

    //! When
    const result = TestBed.runInInjectionContext(() => authGuard(route, mockState));

    //! Then - Retorna un UrlTree que redirige a /login
    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/login');
  });

  it('should redirect to /forbidden when user lacks the required role', () => {
    //! Given - Usuario autenticado pero con rol 'user', no 'admin'
    authState.setSession(true, ['user']);
    const route = createMockRoute({ requiredRole: 'admin' });

    //! When
    const result = TestBed.runInInjectionContext(() => authGuard(route, mockState));

    //! Then - Retorna un UrlTree que redirige a /forbidden
    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/forbidden');
  });

  it('should allow access when no requiredRole is specified (only checks authentication)', () => {
    //! Given - Usuario autenticado, ruta sin requiredRole
    authState.setSession(true, ['user']);
    const route = createMockRoute({}); //? Sin requiredRole en data

    //! When
    const result = TestBed.runInInjectionContext(() => authGuard(route, mockState));

    //! Then - Solo verifica autenticacion, no rol
    expect(result).toBe(true);
  });

  it('should redirect to /login even when requiredRole exists but user is not authenticated', () => {
    //! Given - No autenticado, la ruta requiere rol
    authState.setSession(false, ['admin']);
    const route = createMockRoute({ requiredRole: 'admin' });

    //! When
    const result = TestBed.runInInjectionContext(() => authGuard(route, mockState));

    //! Then - Primero verifica autenticacion, no llega a verificar el rol
    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/login');
  });
});
