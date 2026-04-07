import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, Injectable, input, OnInit, output, signal } from '@angular/core';
import { Observable, of } from 'rxjs';

// ─────────────────────────────────────────────
// Servicio de favoritos (definido aqui para simplicidad)
// ─────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  public toggleFavorite(productName: string): Observable<boolean> {
    //? En la app real, esto haria una peticion HTTP
    return of(true);
  }
}

// ─────────────────────────────────────────────
// Componente de tarjeta de producto
// ─────────────────────────────────────────────

@Component({
  selector: 'app-product-card',
  imports: [CurrencyPipe],
  templateUrl: './product-card.component.html',
})
export class ProductCardComponent implements OnInit {
  //? Servicio inyectado
  private favoritesSvc = inject(FavoritesService);

  // ─────────────────────────────────────────
  // Signal-based Inputs (Angular 19)
  // ─────────────────────────────────────────

  //? input.required -> el padre DEBE proveer este valor
  public name = input.required<string>();
  public price = input.required<number>();

  //? input() con valor por defecto -> opcional
  public stock = input(0);
  public category = input<'electronics' | 'clothing' | 'food'>('electronics');

  // ─────────────────────────────────────────
  // Signal-based Output (Angular 19)
  // ─────────────────────────────────────────

  //? output<T>() reemplaza al @Output() EventEmitter<T>
  public addToCart = output<{ name: string; quantity: number }>();

  // ─────────────────────────────────────────
  // Signals internos y computed
  // ─────────────────────────────────────────

  //? Signal para la cantidad a agregar al carrito
  public quantity = signal(1);

  //? Signal para estado de favorito
  public isFavorite = signal(false);

  //? Computed signals (se recalculan automaticamente cuando sus dependencias cambian)
  public isAvailable = computed(() => this.stock() > 0);
  public priceWithTax = computed(() => +(this.price() * 1.16).toFixed(2));

  public stockLabel = computed(() => {
    const stock = this.stock();
    if (stock === 0) return 'Agotado';
    if (stock <= 3) return 'Ultimas unidades';
    return 'En stock';
  });

  // ─────────────────────────────────────────
  // Lifecycle hook
  // ─────────────────────────────────────────

  public initialized = false;

  ngOnInit(): void {
    this.initialized = true;
  }

  // ─────────────────────────────────────────
  // Metodos
  // ─────────────────────────────────────────

  public incrementQuantity(): void {
    if (this.quantity() < this.stock()) {
      this.quantity.update((q) => q + 1);
    }
  }

  public decrementQuantity(): void {
    if (this.quantity() > 1) {
      this.quantity.update((q) => q - 1);
    }
  }

  public onAddToCart(): void {
    this.addToCart.emit({
      name: this.name(),
      quantity: this.quantity(),
    });
  }

  public onToggleFavorite(): void {
    this.favoritesSvc.toggleFavorite(this.name()).subscribe((result) => {
      this.isFavorite.set(result);
    });
  }
}
