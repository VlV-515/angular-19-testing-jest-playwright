import { Component } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { HighlightDirective } from './highlight.directive';

//?
//? DIRECTIVAS: No se pueden testear solas, necesitan un "componente anfitrion".
//? La razon es que una directiva se aplica a un ELEMENTO del DOM, asi que
//? necesitamos un componente con un template que use la directiva.
//?
//? El patron es:
//? 1. Crear un componente de test minimo (solo un template)
//? 2. Importar la directiva en ese componente
//? 3. Renderizar el componente de test
//? 4. Simular eventos y verificar cambios en el DOM
//?

// ─────────────────────────────────────────────
// Componentes anfitrion (host components) para testing
// ─────────────────────────────────────────────

//?
//? Este componente existe SOLO para el test.
//? Su unico proposito es tener un template donde la directiva se aplique.
//?
@Component({
  imports: [HighlightDirective],
  template: `<p appHighlight data-testid="default">Texto con highlight</p>`,
})
class HostDefaultComponent {}

@Component({
  imports: [HighlightDirective],
  template: `<p appHighlight [highlightColor]="'cyan'" [highlightTextColor]="'white'" data-testid="custom">Texto personalizado</p>`,
})
class HostCustomComponent {}

// ─────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────

describe('HighlightDirective', () => {
  it('should apply default highlight color on mouseenter', async () => {
    //! Given
    await render(HostDefaultComponent);
    const element = screen.getByTestId('default');

    //! When - Simulamos que el mouse entra al elemento
    await userEvent.hover(element);

    //! Then - El fondo deberia ser amarillo (color por defecto)
    expect(element.style.backgroundColor).toBe('yellow');
    expect(element.style.color).toBe('black');
  });

  it('should remove highlight color on mouseleave', async () => {
    //! Given
    await render(HostDefaultComponent);
    const element = screen.getByTestId('default');

    //! When - Mouse entra y luego sale
    await userEvent.hover(element);
    await userEvent.unhover(element);

    //! Then - Los estilos vuelven a su estado original (vacio)
    expect(element.style.backgroundColor).toBe('');
    expect(element.style.color).toBe('');
  });

  it('should apply custom highlight color on mouseenter', async () => {
    //! Given - Componente con colores personalizados
    await render(HostCustomComponent);
    const element = screen.getByTestId('custom');

    //! When
    await userEvent.hover(element);

    //! Then - Usa los colores personalizados, no los defaults
    expect(element.style.backgroundColor).toBe('cyan');
    expect(element.style.color).toBe('white');
  });

  it('should restore original styles on mouseleave after custom highlight', async () => {
    //! Given
    await render(HostCustomComponent);
    const element = screen.getByTestId('custom');

    //! When - Hover y luego salir
    await userEvent.hover(element);
    expect(element.style.backgroundColor).toBe('cyan'); //? Verificamos que el highlight se aplico

    await userEvent.unhover(element);

    //! Then - Estilos restaurados
    expect(element.style.backgroundColor).toBe('');
  });

  it('should handle multiple hover cycles', async () => {
    //! Given
    await render(HostDefaultComponent);
    const element = screen.getByTestId('default');

    //! When - Multiples ciclos de hover
    await userEvent.hover(element);
    expect(element.style.backgroundColor).toBe('yellow');

    await userEvent.unhover(element);
    expect(element.style.backgroundColor).toBe('');

    await userEvent.hover(element);
    expect(element.style.backgroundColor).toBe('yellow');

    await userEvent.unhover(element);

    //! Then - Sigue funcionando despues de multiples ciclos
    expect(element.style.backgroundColor).toBe('');
  });
});
