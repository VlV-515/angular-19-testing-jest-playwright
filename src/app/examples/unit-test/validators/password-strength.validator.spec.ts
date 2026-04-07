import { FormControl, FormGroup } from '@angular/forms';
import { fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import {
  passwordMatchValidator,
  passwordStrengthValidator,
  usernameAvailabilityValidator,
  UserService,
} from './password-strength.validator';

//?
//? VALIDADORES: Al igual que las pipes, los validadores son funciones puras.
//? La diferencia es que trabajan con FormControl/FormGroup de Angular.
//? Los validadores sincronos NO necesitan TestBed.
//? Los validadores asincronos usan fakeAsync + tick para simular el paso del tiempo.
//?

// ─────────────────────────────────────────────
// Validador sincrono: passwordStrengthValidator
// ─────────────────────────────────────────────

describe('passwordStrengthValidator', () => {
  //? Creamos el validador una sola vez (es una funcion pura, no cambia entre tests)
  const validator = passwordStrengthValidator();

  it('should return null when password meets all requirements', () => {
    //! Given - Una contrasena que cumple TODAS las reglas
    const control = new FormControl('MyP@ssw0rd');

    //! When
    const result = validator(control);

    //! Then - null significa "valido, sin errores"
    expect(result).toBeNull();
  });

  it('should return minLength error when password is too short', () => {
    //! Given - Contrasena con solo 4 caracteres (necesita minimo 8)
    const control = new FormControl('Ab1!');

    //! When
    const result = validator(control);

    //! Then
    expect(result).toEqual({
      passwordStrength: expect.objectContaining({ minLength: true }),
    });
  });

  it('should return uppercase error when no uppercase letter', () => {
    //! Given - Contrasena sin mayusculas
    const control = new FormControl('password1!');

    //! When
    const result = validator(control);

    //! Then
    expect(result).toEqual({
      passwordStrength: expect.objectContaining({ uppercase: true }),
    });
  });

  it('should return lowercase error when no lowercase letter', () => {
    //! Given - Contrasena sin minusculas
    const control = new FormControl('PASSWORD1!');

    //! When
    const result = validator(control);

    //! Then
    expect(result).toEqual({
      passwordStrength: expect.objectContaining({ lowercase: true }),
    });
  });

  it('should return number error when no digit present', () => {
    //! Given - Contrasena sin numeros
    const control = new FormControl('Password!');

    //! When
    const result = validator(control);

    //! Then
    expect(result).toEqual({
      passwordStrength: expect.objectContaining({ number: true }),
    });
  });

  it('should return specialChar error when no special character', () => {
    //! Given - Contrasena sin caracter especial
    const control = new FormControl('Password1');

    //! When
    const result = validator(control);

    //! Then
    expect(result).toEqual({
      passwordStrength: expect.objectContaining({ specialChar: true }),
    });
  });

  it('should return multiple errors when multiple rules fail', () => {
    //! Given - Solo minusculas, falla en: minLength, uppercase, number, specialChar
    const control = new FormControl('abc');

    //! When
    const result = validator(control);

    //! Then
    expect(result).toEqual({
      passwordStrength: {
        minLength: true,
        uppercase: true,
        number: true,
        specialChar: true,
      },
    });
  });

  it('should treat empty string as failing all rules', () => {
    //! Given
    const control = new FormControl('');

    //! When
    const result = validator(control);

    //! Then - Cadena vacia falla en todas las reglas
    expect(result).toEqual({
      passwordStrength: {
        minLength: true,
        uppercase: true,
        lowercase: true,
        number: true,
        specialChar: true,
      },
    });
  });
});

// ─────────────────────────────────────────────
// Validador de grupo: passwordMatchValidator
// ─────────────────────────────────────────────

describe('passwordMatchValidator', () => {
  it('should return null when passwords match', () => {
    //! Given - Un FormGroup con dos campos que tienen el mismo valor
    const group = new FormGroup(
      {
        password: new FormControl('MyP@ssw0rd'),
        confirmPassword: new FormControl('MyP@ssw0rd'),
      },
      { validators: [passwordMatchValidator('password', 'confirmPassword')] },
    );

    //! When - Angular ejecuta el validador automaticamente al crear el grupo
    //! Then
    expect(group.errors).toBeNull();
  });

  it('should return passwordMismatch when passwords do not match', () => {
    //! Given - Un FormGroup con valores diferentes en los dos campos
    const group = new FormGroup(
      {
        password: new FormControl('MyP@ssw0rd'),
        confirmPassword: new FormControl('OtraContrasena'),
      },
      { validators: [passwordMatchValidator('password', 'confirmPassword')] },
    );

    //! When - Angular ejecuta el validador automaticamente
    //! Then
    expect(group.errors).toEqual({ passwordMismatch: true });
  });

  it('should update validity when field values change', () => {
    //! Given - Empezamos con valores diferentes
    const group = new FormGroup(
      {
        password: new FormControl('Pass1'),
        confirmPassword: new FormControl('Pass2'),
      },
      { validators: [passwordMatchValidator('password', 'confirmPassword')] },
    );
    expect(group.errors).toEqual({ passwordMismatch: true });

    //! When - Cambiamos el valor de confirmPassword para que coincida
    group.get('confirmPassword')!.setValue('Pass1');

    //! Then - Ahora deberia ser valido
    expect(group.errors).toBeNull();
  });
});

// ─────────────────────────────────────────────
// Validador asincrono: usernameAvailabilityValidator
// ─────────────────────────────────────────────

describe('usernameAvailabilityValidator', () => {
  let userServiceMock: jest.Mocked<UserService>;

  beforeEach(() => {
    //? Creamos un mock del servicio con jest.fn()
    userServiceMock = {
      checkUsernameAvailability: jest.fn(),
    };
  });

  //?
  //? fakeAsync + tick: Permiten controlar el paso del tiempo en los tests.
  //? Nuestro validador usa debounceTime(300), lo que significa que espera 300ms
  //? antes de hacer la verificacion. Con tick(300) simulamos que pasaron 300ms.
  //?

  it('should return null for available username', fakeAsync(() => {
    //! Given - El servicio dice que el username esta disponible
    userServiceMock.checkUsernameAvailability.mockReturnValue(of(true));
    const validator = usernameAvailabilityValidator(userServiceMock);
    const control = new FormControl('newuser');

    //! When
    let result: any;
    validator(control).subscribe((r) => (result = r));
    tick(300); //? Simulamos que pasaron 300ms (debounceTime)

    //! Then
    expect(result).toBeNull();
    expect(userServiceMock.checkUsernameAvailability).toHaveBeenCalledWith('newuser');
  }));

  it('should return usernameTaken for unavailable username', fakeAsync(() => {
    //! Given - El servicio dice que el username NO esta disponible
    userServiceMock.checkUsernameAvailability.mockReturnValue(of(false));
    const validator = usernameAvailabilityValidator(userServiceMock);
    const control = new FormControl('admin');

    //! When
    let result: any;
    validator(control).subscribe((r) => (result = r));
    tick(300);

    //! Then
    expect(result).toEqual({ usernameTaken: true });
  }));

  it('should return null for empty username without calling service', fakeAsync(() => {
    //! Given - Campo vacio
    const validator = usernameAvailabilityValidator(userServiceMock);
    const control = new FormControl('');

    //! When
    let result: any;
    validator(control).subscribe((r) => (result = r));
    tick(300);

    //! Then - No deberia llamar al servicio para un campo vacio
    expect(result).toBeNull();
    expect(userServiceMock.checkUsernameAvailability).not.toHaveBeenCalled();
  }));

  it('should handle service error gracefully', fakeAsync(() => {
    //! Given - El servicio lanza un error (ej: servidor caido)
    userServiceMock.checkUsernameAvailability.mockReturnValue(
      throwError(() => new Error('Server error')),
    );
    const validator = usernameAvailabilityValidator(userServiceMock);
    const control = new FormControl('testuser');

    //! When & Then - No deberia lanzar excepcion
    let result: any;
    let errorOccurred = false;
    validator(control).subscribe({
      next: (r) => (result = r),
      error: () => (errorOccurred = true),
    });
    tick(300);

    //? Cuando el servicio falla, el error se propaga al subscriber
    //? En una app real, manejaríamos esto con catchError en el validador
    expect(errorOccurred).toBe(true);
  }));
});
