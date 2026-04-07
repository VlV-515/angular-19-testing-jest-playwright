# Unit Test: Directives

## Que es una Directiva en Angular?

Hay 3 tipos de directivas en Angular:

| Tipo | Ejemplo | Que hace |
|------|---------|----------|
| **Componente** | `<app-header>` | Directiva con template (tiene HTML propio) |
| **Estructural** | `*ngIf`, `@if` | Modifica la estructura del DOM (agrega/quita elementos) |
| **De atributo** | `[appHighlight]` | Modifica el comportamiento o apariencia de un elemento existente |

En este ejemplo trabajamos con una **directiva de atributo**.

## Por que las Directivas necesitan un componente anfitrion?

Una directiva de atributo se aplica a un ELEMENTO del DOM:

```html
<p appHighlight>Este texto se resalta al hacer hover</p>
```

No puede existir por si sola. Necesita un elemento donde "vivir".
Por eso, para testearla, creamos un **componente minimo** que solo tiene
un template con la directiva aplicada.

## Archivo: highlight.directive.ts

### Que hace?

Directiva que resalta un elemento al hacer hover:
- `mouseenter` -> Cambia el color de fondo y el color del texto
- `mouseleave` -> Restaura los estilos originales

### Inputs

| Input | Tipo | Default | Proposito |
|-------|------|---------|-----------|
| `highlightColor` | `string` | `'yellow'` | Color de fondo al hacer hover |
| `highlightTextColor` | `string` | `'black'` | Color del texto al hacer hover |

### Conceptos de Angular usados

**`@HostListener`** - Escucha eventos del elemento donde se aplica la directiva:
```typescript
@HostListener('mouseenter')
onMouseEnter(): void {
  // Se ejecuta cuando el mouse entra al elemento
}
```

**`ElementRef`** - Referencia al elemento DOM nativo:
```typescript
private el = inject(ElementRef);
this.el.nativeElement.style.backgroundColor; // Acceso al DOM
```

**`Renderer2`** - Manipulador seguro del DOM (compatible con SSR):
```typescript
private renderer = inject(Renderer2);
this.renderer.setStyle(this.el.nativeElement, 'backgroundColor', 'yellow');
```

## Archivo: highlight.directive.spec.ts

### Estructura del test

```
// Componentes anfitrion (solo para tests)
HostDefaultComponent   -> <p appHighlight>
HostCustomComponent    -> <p appHighlight [highlightColor]="'cyan'">

describe('HighlightDirective')
  it -> mouseenter aplica color default (yellow)
  it -> mouseleave restaura estilos
  it -> mouseenter aplica color personalizado (cyan)
  it -> mouseleave restaura despues de color personalizado
  it -> multiples ciclos de hover funcionan correctamente
```

### Conceptos clave del test

#### 1. El patron "componente anfitrion" (host component)

```typescript
@Component({
  imports: [HighlightDirective],
  template: `<p appHighlight data-testid="default">Texto con highlight</p>`,
})
class HostDefaultComponent {}
```

Este componente:
- Existe **solo para el test** (no es parte de la app real)
- Su template usa la directiva `appHighlight`
- Importa la directiva para que Angular la reconozca
- Usa `data-testid` para encontrar facilmente el elemento en el test

#### 2. Simular hover con Testing Library

```typescript
await userEvent.hover(element);    // Simula mouseenter
await userEvent.unhover(element);  // Simula mouseleave
```

`userEvent.hover()` y `userEvent.unhover()` son mas realistas que
disparar eventos manualmente con `fireEvent`. Simulan el comportamiento
real del mouse del usuario.

#### 3. Verificar estilos inline

```typescript
expect(element.style.backgroundColor).toBe('yellow');
```

La directiva modifica estilos inline del elemento. Podemos verificarlos
directamente accediendo a `element.style`.

#### 4. Verificar restauracion de estilos

```typescript
// Antes del hover, no hay estilos inline
expect(element.style.backgroundColor).toBe('');

// Durante el hover
await userEvent.hover(element);
expect(element.style.backgroundColor).toBe('yellow');

// Despues del hover, se restauran
await userEvent.unhover(element);
expect(element.style.backgroundColor).toBe('');
```

Es importante verificar que la directiva NO solo aplica estilos,
sino que tambien los restaura correctamente.

## Cuando usar el patron de host component?

Siempre que testees:
- Directivas de atributo (como este ejemplo)
- Directivas estructurales personalizadas
- Cualquier pieza de Angular que necesite un elemento DOM para funcionar

## Ejecutar los tests

```bash
npm run test -- --testPathPattern="highlight.directive"
```
