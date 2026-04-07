import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, map, Observable, tap, throwError } from 'rxjs';

// ─────────────────────────────────────────────
// Interfaz del producto
// ─────────────────────────────────────────────

export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  active: boolean;
}

// ─────────────────────────────────────────────
// Servicio CRUD de productos
// ─────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);

  //? Estado interno con signals
  //? _products es privado (solo el servicio lo modifica)
  //? products es de solo lectura (los componentes pueden leerlo pero no modificarlo)
  private _products = signal<Product[]>([]);
  public products = this._products.asReadonly();

  //? Signal de loading para saber si hay una peticion en curso
  private _loading = signal(false);
  public loading = this._loading.asReadonly();

  //* GET /api/products - Obtener todos los productos
  public getAll(): Observable<Product[]> {
    this._loading.set(true);

    return this.http.get<Product[]>('/api/products').pipe(
      tap((products) => this._products.set(products)), //? Actualiza el estado interno
      finalize(() => this._loading.set(false)), //? Loading = false cuando termina (exito o error)
    );
  }

  //* GET /api/products/:id - Obtener un producto por ID
  public getById(id: number): Observable<Product> {
    this._loading.set(true);

    return this.http.get<Product>(`/api/products/${id}`).pipe(
      finalize(() => this._loading.set(false)),
    );
  }

  //* POST /api/products - Crear un nuevo producto
  public create(product: Omit<Product, 'id'>): Observable<Product> {
    return this.http.post<Product>('/api/products', product);
  }

  //* PUT /api/products/:id - Actualizar un producto
  public update(id: number, changes: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`/api/products/${id}`, changes);
  }

  //* DELETE /api/products/:id - Eliminar un producto
  public delete(id: number): Observable<void> {
    return this.http.delete<void>(`/api/products/${id}`);
  }

  //* GET /api/products?name=query - Buscar productos por nombre
  public searchByName(query: string): Observable<Product[]> {
    const params = new HttpParams().set('name', query);

    return this.http.get<Product[]>('/api/products', { params });
  }

  //* Filtro local (no HTTP) - Retorna solo los productos activos del estado actual
  public getActiveProducts(): Product[] {
    return this._products().filter((p) => p.active);
  }

  //* GET /api/products/:id - Con manejo de errores
  public getByIdSafe(id: number): Observable<Product | null> {
    return this.http.get<Product>(`/api/products/${id}`).pipe(
      catchError((error) => {
        console.error(`Error fetching product ${id}:`, error.message);
        return throwError(() => error);
      }),
    );
  }
}
