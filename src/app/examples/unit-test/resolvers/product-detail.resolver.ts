import { inject, Injectable } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { catchError, EMPTY, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

// ─────────────────────────────────────────────
// Interfaz del producto (simplificada para este ejemplo)
// ─────────────────────────────────────────────

export interface Product {
  id: number;
  name: string;
  price: number;
}

// ─────────────────────────────────────────────
// Servicio de API de productos
// (Definido aqui para simplicidad del ejemplo)
// ─────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ProductApiService {
  private http = inject(HttpClient);

  public getById(id: number): Observable<Product> {
    return this.http.get<Product>(`/api/products/${id}`);
  }
}

// ─────────────────────────────────────────────
// Resolver funcional (ResolveFn)
// ─────────────────────────────────────────────

/**
 * Resolver funcional que pre-carga los datos de un producto antes de que
 * la ruta se active. Esto garantiza que el componente tenga los datos
 * disponibles inmediatamente cuando se renderiza.
 *
 * En Angular 19, los resolvers son FUNCIONES (no clases).
 *
 * Configuracion en rutas:
 *   { path: 'products/:id', resolve: { product: productDetailResolver }, component: ProductDetailComponent }
 *
 * El componente accede a los datos resueltos asi:
 *   const product = inject(ActivatedRoute).snapshot.data['product'];
 *
 * Comportamiento:
 *   1. Si no hay ID en la ruta o no es numerico -> redirige a /products
 *   2. Si la API retorna error -> redirige a /not-found
 *   3. Si todo ok -> retorna el producto
 */
export const productDetailResolver: ResolveFn<Product> = (route, _state) => {
  const productApi = inject(ProductApiService);
  const router = inject(Router);

  //? Obtenemos el ID del parametro de ruta
  const idParam = route.paramMap.get('id');

  //? Validamos que el ID exista y sea numerico
  if (!idParam || isNaN(Number(idParam))) {
    router.navigate(['/products']);
    return EMPTY; //? EMPTY completa sin emitir valores, cancelando la navegacion
  }

  const id = Number(idParam);

  //? Hacemos la peticion y manejamos errores
  return productApi.getById(id).pipe(
    catchError(() => {
      router.navigate(['/not-found']);
      return EMPTY; //? Si falla, redirigimos y cancelamos
    }),
  );
};
