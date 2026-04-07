import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

// ─────────────────────────────────────────────
// Servicio de almacenamiento de token
// (Definido aqui para simplicidad del ejemplo)
// ─────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private token: string | null = null;

  public getToken(): string | null {
    return this.token;
  }

  public setToken(token: string): void {
    this.token = token;
  }

  public clearToken(): void {
    this.token = null;
  }
}

// ─────────────────────────────────────────────
// Interceptor funcional (HttpInterceptorFn)
// ─────────────────────────────────────────────

/**
 * Interceptor funcional que:
 * 1. Agrega el header Authorization con el token JWT a peticiones internas (/api)
 * 2. Maneja errores 401 (no autorizado): limpia el token y redirige a /login
 * 3. NO modifica peticiones a URLs externas
 *
 * En Angular 19, los interceptors son FUNCIONES (no clases).
 *
 * Configuracion:
 *   provideHttpClient(withInterceptors([authTokenInterceptor]))
 */
export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);

  //? Solo agregamos el token a peticiones internas (que empiezan con /api)
  const token = tokenStorage.getToken();
  const isInternalRequest = req.url.startsWith('/api');

  if (token && isInternalRequest) {
    //? Clonamos la request y agregamos el header
    //? Las requests HTTP son inmutables, por eso necesitamos clone()
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  //? Pasamos la request (original o clonada) al siguiente handler
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      //? Si el servidor responde 401, la sesion expiro o el token es invalido
      if (error.status === 401) {
        tokenStorage.clearToken();
        router.navigate(['/login']);
      }

      //? Re-lanzamos el error para que el servicio que hizo la peticion pueda manejarlo
      return throwError(() => error);
    }),
  );
};
