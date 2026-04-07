# Unit Test: Pipes

## Que es una Pipe?

Una **pipe** en Angular es una clase que transforma datos en el template.
Por ejemplo, `{{ 'hola' | uppercase }}` convierte "hola" a "HOLA".

Angular tiene pipes integradas (`date`, `currency`, `uppercase`, etc.) pero tambien
puedes crear pipes personalizadas como la que tenemos aqui: `TruncatePipe`.

## Por que las Pipes son lo mas facil de testear?

Las pipes puras son **funciones puras**: reciben un valor, lo transforman y retornan el resultado.
No tienen dependencias de Angular, no necesitan inyeccion de dependencias, no necesitan TestBed.

```typescript
// Asi de simple es testear una pipe:
const pipe = new TruncatePipe();           // 1. La instancias como cualquier clase
const result = pipe.transform('texto', 10); // 2. Llamas a transform()
expect(result).toBe('texto');               // 3. Verificas el resultado
```

## Archivo: truncate.pipe.ts

### Que hace?

Trunca un texto largo y agrega un sufijo (por defecto `...`). Caracteristicas:

- Si el valor es `null`, `undefined` o vacio -> retorna `''`
- Si el texto es mas corto que `maxLength` -> lo retorna tal cual
- Si el texto es mas largo -> lo corta en el **ultimo espacio** antes del limite (para no cortar palabras)
- Acepta parametros opcionales: `maxLength` (default 50) y `suffix` (default '...')

### Parametros de transform()

| Parametro | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| `value` | `string \| null \| undefined` | - | El texto a truncar |
| `maxLength` | `number` | `50` | Longitud maxima antes de truncar |
| `suffix` | `string` | `'...'` | Texto que se agrega al final si se trunca |

## Archivo: truncate.pipe.spec.ts

### Estructura del test

```
describe('TruncatePipe')
  beforeEach -> Crea nueva instancia de TruncatePipe
  it -> null input
  it -> undefined input
  it -> empty string
  it -> string mas corto que maxLength
  it -> string exactamente igual a maxLength
  it -> truncamiento con sufijo default
  it -> truncamiento con sufijo personalizado
  it -> truncamiento sin espacios (corta en maxLength exacto)
  it -> truncamiento en el ultimo espacio
```

### Conceptos clave del test

#### 1. No se usa TestBed

```typescript
beforeEach(() => {
  pipe = new TruncatePipe(); // Instanciacion directa, sin Angular
});
```

Las pipes puras no necesitan el entorno de Angular para funcionar.
Son clases normales de TypeScript.

#### 2. Edge cases (casos limite)

Siempre testea los "bordes" de tu logica:
- Que pasa con `null`? Y con `undefined`? Y con un string vacio?
- Que pasa cuando el texto es **exactamente** igual al limite?
- Que pasa cuando no hay espacios donde cortar?

Estos son los casos donde mas bugs se esconden.

#### 3. Patron Given-When-Then

Cada test sigue el patron:
```typescript
it('should return empty string for null input', () => {
  //! Given - El valor de entrada
  const value = null;

  //! When - Ejecutamos transform
  const result = pipe.transform(value);

  //! Then - Verificamos el resultado
  expect(result).toBe('');
});
```

## Cuando usar este patron (testear sin TestBed)?

Usa este patron para cualquier pieza de Angular que sea una **funcion pura**:

- Pipes puras (como este ejemplo)
- Funciones utilitarias
- Validadores sincronos simples
- Cualquier clase sin dependencias de Angular

## Ejecutar los tests

```bash
npm run test -- --testPathPattern="truncate.pipe"
```
