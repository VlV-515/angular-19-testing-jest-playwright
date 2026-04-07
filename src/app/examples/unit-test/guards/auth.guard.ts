import { inject, Injectable, signal } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

// ─────────────────────────────────────────────
// Servicio de estado de autenticacion
// (Definido aqui para simplicidad del ejemplo)
// ─────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  //? Signals privados para manejar el estado
  private _isLoggedIn = signal(false);
  private _roles = signal<string[]>([]);

  //? Metodos publicos de lectura
  public isAuthenticated(): boolean {
    return this._isLoggedIn();
  }

  public hasRole(role: string): boolean {
    return this._roles().includes(role);
  }

  //? Metodo para configurar la sesion (usado en tests y al hacer login real)
  public setSession(loggedIn: boolean, roles: string[]): void {
    this._isLoggedIn.set(loggedIn);
    this._roles.set(roles);
  }
}

// ─────────────────────────────────────────────
// Guard funcional (CanActivateFn)
// ─────────────────────────────────────────────

/**
 * Guard funcional que protege rutas verificando autenticacion y roles.
 *
 * En Angular 19, los guards son FUNCIONES (no clases).
 * Usan inject() para obtener servicios dentro de la funcion.
 *
 * Configuracion en rutas:
 *   { path: 'admin', canActivate: [authGuard], data: { requiredRole: 'admin' } }
 *   { path: 'profile', canActivate: [authGuard] }  // Solo verifica autenticacion
 *
 * Comportamiento:
 *   1. Si NO esta autenticado -> redirige a /login
 *   2. Si esta autenticado pero NO tiene el rol requerido -> redirige a /forbidden
 *   3. Si esta autenticado y tiene el rol (o no se requiere rol) -> permite acceso (true)
 */
export const authGuard: CanActivateFn = (route, _state) => {
  //? inject() funciona aqui porque Angular ejecuta el guard dentro de un injection context
  const authState = inject(AuthStateService);
  const router = inject(Router);

  //? Paso 1: Verificar si esta autenticado
  if (!authState.isAuthenticated()) {
    return router.createUrlTree(['/login']); //? Redirige a login
  }

  //? Paso 2: Verificar rol (si se requiere)
  const requiredRole = route.data?.['requiredRole'] as string | undefined;

  if (requiredRole && !authState.hasRole(requiredRole)) {
    return router.createUrlTree(['/forbidden']); //? Redirige a forbidden
  }

  //? Paso 3: Todo ok, permite el acceso
  return true;
};
