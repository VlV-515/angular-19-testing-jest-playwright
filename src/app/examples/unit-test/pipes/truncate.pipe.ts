import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe que trunca un texto a una longitud maxima y agrega un sufijo configurable.
 * Si el texto es mas largo que maxLength, se corta en el ultimo espacio antes del limite
 * para no cortar palabras a la mitad.
 *
 * Uso en template:
 *   {{ 'Texto muy largo que necesita ser cortado' | truncate }}
 *   {{ 'Texto muy largo' | truncate:20 }}
 *   {{ 'Texto muy largo' | truncate:20:' [ver mas]' }}
 */
@Pipe({ name: 'truncate' })
export class TruncatePipe implements PipeTransform {
  transform(value: string | null | undefined, maxLength = 50, suffix = '...'): string {
    //? Si el valor es null, undefined o vacio, retornamos cadena vacia
    if (!value) return '';

    //? Si el texto es mas corto o igual que el maximo, lo retornamos tal cual
    if (value.length <= maxLength) return value;

    //? Buscamos el ultimo espacio antes del limite para no cortar palabras
    const truncated = value.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');

    //? Si hay un espacio, cortamos ahi. Si no, cortamos en maxLength exacto
    const cutPoint = lastSpace > 0 ? lastSpace : maxLength;

    return value.substring(0, cutPoint) + suffix;
  }
}
