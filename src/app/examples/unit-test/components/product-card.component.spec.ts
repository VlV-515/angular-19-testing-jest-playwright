import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { of } from 'rxjs';
import { FavoritesService, ProductCardComponent } from './product-card.component';

//?
//? COMPONENTES: Es el test mas completo. Integra todos los conceptos:
//? - Testing Library (render, screen, userEvent)
//? - Mock de servicios inyectados
//? - Signal inputs con componentInputs
//? - Signal outputs con subscribe
//? - Verificacion de renderizado condicional (@if, @switch)
//? - Interacciones de usuario
//?

describe('ProductCardComponent', () => {
  let favoritesSvcMock: jest.Mocked<FavoritesService>;

  beforeEach(() => {
    //? Creamos mock del servicio de favoritos
    favoritesSvcMock = {
      toggleFavorite: jest.fn(),
    } as unknown as jest.Mocked<FavoritesService>;
  });

  //?
  //? Helper para renderizar el componente con inputs por defecto.
  //? componentInputs es la forma de pasar signal inputs en Testing Library.
  //?
  const renderComponent = (inputs: Partial<{ name: string; price: number; stock: number; category: 'electronics' | 'clothing' | 'food' }> = {}) => {
    return render(ProductCardComponent, {
      componentInputs: {
        name: 'Laptop Pro',
        price: 999,
        stock: 10,
        category: 'electronics' as const,
        ...inputs,
      },
      providers: [
        { provide: FavoritesService, useValue: favoritesSvcMock },
      ],
    });
  };

  // ─────────────────────────────────────────────
  // Renderizado basico
  // ─────────────────────────────────────────────

  it('should render the product name and formatted price', async () => {
    //! Given & When
    await renderComponent();

    //! Then
    expect(screen.getByText('Laptop Pro')).toBeInTheDocument();
    expect(screen.getByTestId('price')).toHaveTextContent('$999.00');
  });

  it('should calculate and display price with tax', async () => {
    //! Given & When
    await renderComponent({ price: 100 });

    //! Then - 100 * 1.16 = 116
    expect(screen.getByTestId('price-with-tax')).toHaveTextContent('$116.00');
  });

  // ─────────────────────────────────────────────
  // Stock labels
  // ─────────────────────────────────────────────

  it('should show "Agotado" when stock is 0', async () => {
    //! Given & When
    await renderComponent({ stock: 0 });

    //! Then
    expect(screen.getByTestId('stock-label')).toHaveTextContent('Agotado');
  });

  it('should show "Ultimas unidades" when stock is between 1 and 3', async () => {
    //! Given & When
    await renderComponent({ stock: 2 });

    //! Then
    expect(screen.getByTestId('stock-label')).toHaveTextContent('Ultimas unidades');
  });

  it('should show "En stock" when stock is greater than 3', async () => {
    //! Given & When
    await renderComponent({ stock: 10 });

    //! Then
    expect(screen.getByTestId('stock-label')).toHaveTextContent('En stock');
  });

  // ─────────────────────────────────────────────
  // Renderizado condicional (@if, @switch)
  // ─────────────────────────────────────────────

  it('should hide add-to-cart button when stock is 0', async () => {
    //! Given & When
    await renderComponent({ stock: 0 });

    //! Then - queryByTestId retorna null si el elemento NO existe (en vez de lanzar error)
    expect(screen.queryByTestId('add-to-cart-btn')).not.toBeInTheDocument();
  });

  it('should show add-to-cart button when stock is available', async () => {
    //! Given & When
    await renderComponent({ stock: 5 });

    //! Then
    expect(screen.getByTestId('add-to-cart-btn')).toBeInTheDocument();
  });

  it('should display correct category icon using @switch', async () => {
    //! Given & When - Categoria 'food'
    await renderComponent({ category: 'food' });

    //! Then
    expect(screen.getByTestId('category-icon')).toHaveTextContent('🍕');
  });

  it('should display electronics icon for electronics category', async () => {
    //! Given & When
    await renderComponent({ category: 'electronics' });

    //! Then
    expect(screen.getByTestId('category-icon')).toHaveTextContent('💻');
  });

  // ─────────────────────────────────────────────
  // Interacciones: Cantidad
  // ─────────────────────────────────────────────

  it('should increment quantity when + button is clicked', async () => {
    //! Given
    await renderComponent({ stock: 5 });

    //! When
    await userEvent.click(screen.getByTestId('increment-btn'));

    //! Then
    expect(screen.getByTestId('quantity')).toHaveTextContent('2');
  });

  it('should decrement quantity when - button is clicked', async () => {
    //! Given
    await renderComponent({ stock: 5 });
    await userEvent.click(screen.getByTestId('increment-btn')); //? Subimos a 2 primero

    //! When
    await userEvent.click(screen.getByTestId('decrement-btn'));

    //! Then
    expect(screen.getByTestId('quantity')).toHaveTextContent('1');
  });

  it('should not decrement quantity below 1', async () => {
    //! Given - Cantidad inicial es 1
    await renderComponent({ stock: 5 });

    //! When - Intentamos bajar de 1
    await userEvent.click(screen.getByTestId('decrement-btn'));

    //! Then - Se mantiene en 1
    expect(screen.getByTestId('quantity')).toHaveTextContent('1');
  });

  it('should not increment quantity above stock', async () => {
    //! Given - Stock es 2
    await renderComponent({ stock: 2 });

    //! When - Intentamos subir mas alla del stock
    await userEvent.click(screen.getByTestId('increment-btn')); //? 2
    await userEvent.click(screen.getByTestId('increment-btn')); //? Sigue en 2 (stock es 2)

    //! Then
    expect(screen.getByTestId('quantity')).toHaveTextContent('2');
  });

  // ─────────────────────────────────────────────
  // Output: addToCart
  // ─────────────────────────────────────────────

  it('should emit addToCart event with correct data when button is clicked', async () => {
    //! Given
    const addToCartSpy = jest.fn();
    const { fixture } = await renderComponent({ name: 'Mouse', stock: 5 });

    //? Nos suscribimos al output para capturar el evento emitido
    fixture.componentInstance.addToCart.subscribe(addToCartSpy);

    //! When
    await userEvent.click(screen.getByTestId('add-to-cart-btn'));

    //! Then
    expect(addToCartSpy).toHaveBeenCalledWith({ name: 'Mouse', quantity: 1 });
  });

  it('should emit addToCart with updated quantity', async () => {
    //! Given
    const addToCartSpy = jest.fn();
    const { fixture } = await renderComponent({ name: 'Teclado', stock: 10 });
    fixture.componentInstance.addToCart.subscribe(addToCartSpy);

    //! When - Incrementamos cantidad y luego agregamos al carrito
    await userEvent.click(screen.getByTestId('increment-btn'));
    await userEvent.click(screen.getByTestId('increment-btn'));
    await userEvent.click(screen.getByTestId('add-to-cart-btn'));

    //! Then - Cantidad deberia ser 3 (1 inicial + 2 incrementos)
    expect(addToCartSpy).toHaveBeenCalledWith({ name: 'Teclado', quantity: 3 });
  });

  // ─────────────────────────────────────────────
  // Servicio: Favoritos
  // ─────────────────────────────────────────────

  it('should call FavoritesService.toggleFavorite when favorite button is clicked', async () => {
    //! Given
    favoritesSvcMock.toggleFavorite.mockReturnValue(of(true));
    await renderComponent({ name: 'Monitor' });

    //! When
    await userEvent.click(screen.getByTestId('favorite-btn'));

    //! Then
    expect(favoritesSvcMock.toggleFavorite).toHaveBeenCalledWith('Monitor');
  });

  it('should update favorite button text after toggling', async () => {
    //! Given
    favoritesSvcMock.toggleFavorite.mockReturnValue(of(true));
    await renderComponent();

    //? Verificamos texto inicial
    expect(screen.getByTestId('favorite-btn')).toHaveTextContent('Agregar favorito');

    //! When
    await userEvent.click(screen.getByTestId('favorite-btn'));

    //! Then - El texto cambia porque isFavorite() ahora es true
    expect(screen.getByTestId('favorite-btn')).toHaveTextContent('Quitar favorito');
  });
});
