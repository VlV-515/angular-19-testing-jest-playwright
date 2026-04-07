import { Directive, ElementRef, HostListener, inject, input, Renderer2 } from '@angular/core';

/**
 * Directiva de atributo que resalta un elemento al hacer hover (mouseenter/mouseleave).
 * Cambia el color de fondo y el color del texto.
 *
 * Uso en template:
 *   <p appHighlight>Texto con highlight amarillo por defecto</p>
 *   <p appHighlight [highlightColor]="'cyan'" [highlightTextColor]="'white'">Highlight personalizado</p>
 */
@Directive({ selector: '[appHighlight]' })
export class HighlightDirective {
  //? Dependencias inyectadas
  private el = inject(ElementRef); //? Referencia al elemento DOM
  private renderer = inject(Renderer2); //? Manipulador de DOM seguro (compatible con SSR)

  //? Inputs configurables con valores por defecto
  public highlightColor = input('yellow');
  public highlightTextColor = input('black');

  //? Guardamos los estilos originales para restaurarlos al salir
  private originalBgColor = '';
  private originalTextColor = '';

  //?
  //? @HostListener escucha eventos del elemento donde se aplica la directiva.
  //? 'mouseenter' se dispara cuando el mouse entra al elemento.
  //?
  @HostListener('mouseenter')
  onMouseEnter(): void {
    //? Guardamos los estilos originales antes de cambiarlos
    this.originalBgColor = this.el.nativeElement.style.backgroundColor;
    this.originalTextColor = this.el.nativeElement.style.color;

    //? Aplicamos los estilos de highlight
    this.renderer.setStyle(this.el.nativeElement, 'backgroundColor', this.highlightColor());
    this.renderer.setStyle(this.el.nativeElement, 'color', this.highlightTextColor());
  }

  //?
  //? 'mouseleave' se dispara cuando el mouse sale del elemento.
  //?
  @HostListener('mouseleave')
  onMouseLeave(): void {
    //? Restauramos los estilos originales
    this.renderer.setStyle(this.el.nativeElement, 'backgroundColor', this.originalBgColor);
    this.renderer.setStyle(this.el.nativeElement, 'color', this.originalTextColor);
  }
}
