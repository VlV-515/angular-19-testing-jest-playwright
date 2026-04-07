# Unit Test: Components

## Por que los Components son el test mas complejo?

Los componentes son la pieza central de Angular. Combinan:
- Template (HTML) con logica de renderizado
- Inputs y Outputs para comunicacion
- Servicios inyectados
- Estado interno (signals)
- Interacciones del usuario (clicks, hover, formularios)

Testear un componente requiere **integrar todos los conceptos** de los ejemplos anteriores.

## Archivo: product-card.component.ts

### Que tiene?

| Feature | Detalle |
|---------|---------|
| **Signal inputs** | `name`, `price` (required), `stock`, `category` (con defaults) |
| **Signal output** | `addToCart` emite `{ name, quantity }` |
| **Computed signals** | `isAvailable`, `priceWithTax`, `stockLabel` |
| **Signal de estado** | `quantity`, `isFavorite` |
| **Servicio inyectado** | `FavoritesService` |
| **Lifecycle** | `OnInit` |
| **Metodos** | `incrementQuantity`, `decrementQuantity`, `onAddToCart`, `onToggleFavorite` |

### Template (product-card.component.html)

Usa la nueva sintaxis de control de flujo de Angular 19:

```html
@switch (category()) {
  @case ('electronics') { <span>💻</span> }
  @case ('food') { <span>🍕</span> }
}

@if (isAvailable()) {
  <button (click)="onAddToCart()">Agregar al carrito</button>
}
```

## Archivo: product-card.component.spec.ts

### Estructura del test

```
describe('ProductCardComponent')
  beforeEach -> Mock de FavoritesService
  helper renderComponent() -> render con inputs por defecto

  // Renderizado basico
  it -> muestra nombre y precio formateado
  it -> calcula precio con IVA

  // Stock labels
  it -> "Agotado" cuando stock = 0
  it -> "Ultimas unidades" cuando stock 1-3
  it -> "En stock" cuando stock > 3

  // Renderizado condicional
  it -> oculta boton cuando stock = 0
  it -> muestra boton cuando hay stock
  it -> icono correcto segun categoria (@switch)

  // Interacciones de cantidad
  it -> incrementar cantidad
  it -> decrementar cantidad
  it -> no baja de 1
  it -> no sube mas que el stock

  // Output addToCart
  it -> emite evento con datos correctos
  it -> emite con cantidad actualizada

  // Servicio
  it -> llama a FavoritesService al hacer click
  it -> actualiza texto del boton despues de toggle
```

### Conceptos clave del test

#### 1. `render()` con `componentInputs` para signal inputs

```typescript
await render(ProductCardComponent, {
  componentInputs: {
    name: 'Laptop Pro',
    price: 999,
    stock: 10,
    category: 'electronics',
  },
  providers: [
    { provide: FavoritesService, useValue: favoritesSvcMock },
  ],
});
```

`componentInputs` es como pasas valores a los signal inputs (`input()`, `input.required()`)
cuando usas Testing Library. Es el equivalente a `<app-product-card [name]="'Laptop'">`
pero en el test.

#### 2. Queries de Testing Library

| Query | Uso | Si no encuentra |
|-------|-----|-----------------|
| `getByText('Laptop')` | Busca por texto visible | Lanza error |
| `getByTestId('price')` | Busca por data-testid | Lanza error |
| `queryByTestId('btn')` | Busca por data-testid | Retorna `null` |
| `findByText('Error')` | Busca asincronamente | Lanza error (timeout) |

**Regla:** Usa `getBy*` cuando el elemento DEBE existir. Usa `queryBy*` cuando
verificas que un elemento NO existe.

#### 3. `toHaveTextContent()` para verificar texto

```typescript
expect(screen.getByTestId('price')).toHaveTextContent('$999.00');
```

`toHaveTextContent` es un matcher de jest-dom. Verifica el contenido de texto
de un elemento del DOM. Es mas robusto que comparar `textContent` directamente
porque ignora espacios extra.

#### 4. Testear outputs con subscribe

```typescript
const addToCartSpy = jest.fn();
const { fixture } = await renderComponent();
fixture.componentInstance.addToCart.subscribe(addToCartSpy);

await userEvent.click(screen.getByTestId('add-to-cart-btn'));

expect(addToCartSpy).toHaveBeenCalledWith({ name: 'Laptop Pro', quantity: 1 });
```

Para testear outputs:
1. Creamos un spy con `jest.fn()`
2. Nos suscribimos al output del componente
3. Ejecutamos la accion que deberia emitir el output
4. Verificamos que el spy fue llamado con los datos correctos

#### 5. `fixture.componentInstance` para acceder al componente

```typescript
const { fixture } = await render(ProductCardComponent, { ... });
const component = fixture.componentInstance;
```

`render()` retorna un objeto con `fixture`. Desde ahi puedes acceder
a la instancia del componente para suscribirte a outputs o verificar estado interno.

#### 6. Helper de renderizado

```typescript
const renderComponent = (inputs = {}) => {
  return render(ProductCardComponent, {
    componentInputs: {
      name: 'Laptop Pro',
      price: 999,
      stock: 10,
      ...inputs,  // Override solo lo que necesites
    },
    providers: [{ provide: FavoritesService, useValue: favoritesSvcMock }],
  });
};
```

Un helper evita repetir la configuracion en cada test.
Solo pasas los inputs que quieres cambiar.

#### 7. `not.toBeInTheDocument()` para verificar ausencia

```typescript
expect(screen.queryByTestId('add-to-cart-btn')).not.toBeInTheDocument();
```

Usa `queryBy*` (no `getBy*`) cuando verificas que algo NO existe.
`getBy*` lanza un error si no encuentra el elemento, mientras que
`queryBy*` retorna `null`.

## Ejecutar los tests

```bash
npm run test -- --testPathPattern="product-card"
```
