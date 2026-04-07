import { AbstractControl, AsyncValidatorFn, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';
import { debounceTime, first, map, Observable, of, switchMap } from 'rxjs';

// ─────────────────────────────────────────────
// Interfaz del servicio que verifica disponibilidad de username
// (Se inyecta como parametro en el validador asincrono)
// ─────────────────────────────────────────────

export interface UserService {
  checkUsernameAvailability(username: string): Observable<boolean>;
}

// ─────────────────────────────────────────────
// Validador sincrono: Fuerza de contrasena
// ─────────────────────────────────────────────

/**
 * Validador que verifica multiples reglas de fuerza de contrasena.
 * Retorna un objeto con las reglas que fallan, o null si todas pasan.
 *
 * Reglas:
 * - Minimo 8 caracteres
 * - Al menos una letra mayuscula
 * - Al menos una letra minuscula
 * - Al menos un numero
 * - Al menos un caracter especial (!@#$%^&*)
 *
 * Uso:
 *   new FormControl('', [passwordStrengthValidator()])
 *
 * Errores posibles:
 *   { passwordStrength: { minLength: true, uppercase: true, number: true } }
 */
export function passwordStrengthValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: string = control.value || '';

    //? Objeto donde acumulamos las reglas que fallan
    const errors: Record<string, boolean> = {};

    if (value.length < 8) errors['minLength'] = true;
    if (!/[A-Z]/.test(value)) errors['uppercase'] = true;
    if (!/[a-z]/.test(value)) errors['lowercase'] = true;
    if (!/[0-9]/.test(value)) errors['number'] = true;
    if (!/[!@#$%^&*]/.test(value)) errors['specialChar'] = true;

    //? Si no hay errores, retornamos null (valido)
    //? Si hay errores, los agrupamos bajo la key 'passwordStrength'
    return Object.keys(errors).length > 0 ? { passwordStrength: errors } : null;
  };
}

// ─────────────────────────────────────────────
// Validador sincrono a nivel de grupo: Contrasenas coinciden
// ─────────────────────────────────────────────

/**
 * Validador a nivel de FormGroup que verifica que dos campos tengan el mismo valor.
 * Util para campos "confirmar contrasena".
 *
 * Uso:
 *   new FormGroup({
 *     password: new FormControl(''),
 *     confirmPassword: new FormControl(''),
 *   }, { validators: [passwordMatchValidator('password', 'confirmPassword')] })
 *
 * Error posible:
 *   { passwordMismatch: true }
 */
export function passwordMatchValidator(passwordField: string, confirmField: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const formGroup = group as FormGroup;
    const password = formGroup.get(passwordField)?.value;
    const confirm = formGroup.get(confirmField)?.value;

    return password === confirm ? null : { passwordMismatch: true };
  };
}

// ─────────────────────────────────────────────
// Validador asincrono: Disponibilidad de username
// ─────────────────────────────────────────────

/**
 * Validador asincrono que verifica si un username esta disponible
 * llamando a un servicio externo (mockeado en tests).
 *
 * Recibe el servicio como parametro (patron factory) en vez de usar inject()
 * para mantenerlo como funcion pura y facilitar el testing.
 *
 * Uso:
 *   new FormControl('', [], [usernameAvailabilityValidator(userService)])
 *
 * Error posible:
 *   { usernameTaken: true }
 */
export function usernameAvailabilityValidator(userService: UserService): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const username = control.value;

    //? Si el campo esta vacio, no validamos
    if (!username) return of(null);

    //? Esperamos 300ms despues de que el usuario deje de escribir (debounce)
    //? y luego hacemos la verificacion
    return of(username).pipe(
      debounceTime(300),
      switchMap((name) => userService.checkUsernameAvailability(name)),
      map((isAvailable) => (isAvailable ? null : { usernameTaken: true })),
      first(), //? Completamos el observable despues del primer valor
    );
  };
}
