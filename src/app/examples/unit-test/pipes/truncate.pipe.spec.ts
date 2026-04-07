import { TruncatePipe } from './truncate.pipe';

//?
//? PIPES: Son las piezas MAS faciles de testear en Angular.
//? Una pipe pura es simplemente una clase con un metodo transform().
//? No necesita TestBed, no necesita Angular, solo la instancias y la usas.
//?

describe('TruncatePipe', () => {
  let pipe: TruncatePipe;

  //? Antes de cada test, creamos una nueva instancia de la pipe
  //? No necesitamos TestBed porque las pipes puras no tienen dependencias de Angular
  beforeEach(() => {
    pipe = new TruncatePipe();
  });

  // ─────────────────────────────────────────────
  // Tests de valores null, undefined y vacios
  // ─────────────────────────────────────────────

  it('should return empty string for null input', () => {
    //! Given
    const value = null;

    //! When
    const result = pipe.transform(value);

    //! Then
    expect(result).toBe('');
  });

  it('should return empty string for undefined input', () => {
    //! Given
    const value = undefined;

    //! When
    const result = pipe.transform(value);

    //! Then
    expect(result).toBe('');
  });

  it('should return empty string for empty string input', () => {
    //! Given
    const value = '';

    //! When
    const result = pipe.transform(value);

    //! Then
    expect(result).toBe('');
  });

  // ─────────────────────────────────────────────
  // Tests de texto que NO necesita ser truncado
  // ─────────────────────────────────────────────

  it('should return the original string when shorter than maxLength', () => {
    //! Given
    const value = 'Hola mundo';

    //! When - maxLength por defecto es 50, 'Hola mundo' tiene 10 caracteres
    const result = pipe.transform(value);

    //! Then
    expect(result).toBe('Hola mundo');
  });

  it('should return the original string when exactly at maxLength', () => {
    //! Given
    const value = '12345'; // 5 caracteres

    //! When
    const result = pipe.transform(value, 5);

    //! Then - No se trunca porque es exactamente igual al limite
    expect(result).toBe('12345');
  });

  // ─────────────────────────────────────────────
  // Tests de truncamiento
  // ─────────────────────────────────────────────

  it('should truncate and add default suffix when string exceeds maxLength', () => {
    //! Given
    const value = 'Angular es un framework para construir aplicaciones web';

    //! When - Truncamos a 20 caracteres
    const result = pipe.transform(value, 20);

    //! Then - Corta en el ultimo espacio antes de 20 caracteres y agrega '...'
    expect(result).toBe('Angular es un...');
  });

  it('should use custom suffix when provided', () => {
    //! Given
    const value = 'Angular es un framework para construir aplicaciones web';

    //! When - Truncamos a 20 caracteres con sufijo personalizado
    const result = pipe.transform(value, 20, ' [+]');

    //! Then
    expect(result).toBe('Angular es un [+]');
  });

  it('should truncate at maxLength when there are no spaces', () => {
    //! Given - Una palabra sin espacios
    const value = 'supercalifragilisticoespialidoso';

    //! When
    const result = pipe.transform(value, 10);

    //! Then - No hay espacio donde cortar, asi que corta en maxLength exacto
    expect(result).toBe('supercalif...');
  });

  it('should truncate at the last space before maxLength to avoid cutting words', () => {
    //! Given
    const value = 'Hola mundo cruel';

    //! When - maxLength=12 cae en medio de "cruel" -> corta en el espacio antes
    const result = pipe.transform(value, 12);

    //! Then - Corta en "Hola mundo" (ultimo espacio antes de posicion 12)
    expect(result).toBe('Hola mundo...');
  });
});
