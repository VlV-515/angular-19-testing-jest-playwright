# Unit Test: Validators

## Que son los Validators en Angular?

Los **validators** son funciones que verifican si el valor de un campo de formulario es valido.
Angular tiene validators integrados (`Validators.required`, `Validators.email`, etc.) pero
tambien puedes crear validadores personalizados.

Hay 3 tipos de validadores:

| Tipo | Se aplica a | Retorna | Ejemplo |
|------|-------------|---------|---------|
| **Sincrono** | `FormControl` | `ValidationErrors \| null` | Verificar fuerza de contrasena |
| **De grupo** | `FormGroup` | `ValidationErrors \| null` | Verificar que dos campos coincidan |
| **Asincrono** | `FormControl` | `Observable<ValidationErrors \| null>` | Verificar disponibilidad de username contra un API |

## Por que los Validators son faciles de testear?

Al igual que las pipes, los validadores sincronos son **funciones puras**:
- Reciben un `AbstractControl` (o sea un `FormControl` / `FormGroup`)
- Retornan un objeto de errores o `null`
- No necesitan TestBed (excepto los asincronos que usan `fakeAsync`)

## Archivo: password-strength.validator.ts

### Validadores incluidos

#### 1. `passwordStrengthValidator()` — Sincrono

Verifica 5 reglas de fuerza de contrasena:

| Regla | Key del error | Expresion regular |
|-------|---------------|-------------------|
| Minimo 8 caracteres | `minLength` | `value.length < 8` |
| Al menos una mayuscula | `uppercase` | `/[A-Z]/` |
| Al menos una minuscula | `lowercase` | `/[a-z]/` |
| Al menos un numero | `number` | `/[0-9]/` |
| Al menos un caracter especial | `specialChar` | `/[!@#$%^&*]/` |

Retorna `{ passwordStrength: { ...errores } }` o `null` si todo esta bien.

#### 2. `passwordMatchValidator(passwordField, confirmField)` — Sincrono (grupo)

Se aplica a un `FormGroup` completo. Compara el valor de dos campos y retorna
`{ passwordMismatch: true }` si no coinciden.

#### 3. `usernameAvailabilityValidator(userService)` — Asincrono

Llama a un servicio externo para verificar si el username esta disponible.
Usa `debounceTime(300)` para no hacer una peticion por cada tecla que el usuario presiona.

## Archivo: password-strength.validator.spec.ts

### Estructura del test

```
describe('passwordStrengthValidator')     <- Validador sincrono
  it -> contrasena valida -> null
  it -> muy corta -> minLength
  it -> sin mayuscula -> uppercase
  it -> sin minuscula -> lowercase
  it -> sin numero -> number
  it -> sin caracter especial -> specialChar
  it -> multiples errores
  it -> string vacio -> todos los errores

describe('passwordMatchValidator')        <- Validador de grupo
  it -> contrasenas iguales -> null
  it -> contrasenas diferentes -> passwordMismatch
  it -> cambiar valor actualiza validez

describe('usernameAvailabilityValidator') <- Validador asincrono
  it -> username disponible -> null
  it -> username ocupado -> usernameTaken
  it -> campo vacio -> null (sin llamar servicio)
  it -> error del servicio
```

### Conceptos clave del test

#### 1. Testear con FormControl directo

```typescript
const validator = passwordStrengthValidator();
const control = new FormControl('Mi valor de prueba');
const result = validator(control);
expect(result).toBeNull();  // o expect(result).toEqual({ ... })
```

No necesitas TestBed. Creas un `FormControl` con el valor que quieres probar,
le pasas el validador y verificas el resultado.

#### 2. Testear validadores de grupo con FormGroup

```typescript
const group = new FormGroup({
  password: new FormControl('Pass1'),
  confirmPassword: new FormControl('Pass2'),
}, { validators: [passwordMatchValidator('password', 'confirmPassword')] });

expect(group.errors).toEqual({ passwordMismatch: true });
```

El validador se ejecuta automaticamente cuando Angular crea el `FormGroup`.

#### 3. `fakeAsync` + `tick` para validadores asincronos

```typescript
it('should return null for available username', fakeAsync(() => {
  userServiceMock.checkUsernameAvailability.mockReturnValue(of(true));
  const validator = usernameAvailabilityValidator(userServiceMock);
  const control = new FormControl('newuser');

  let result: any;
  validator(control).subscribe((r) => (result = r));
  tick(300);  // Avanza el reloj 300ms (el debounceTime del validador)

  expect(result).toBeNull();
}));
```

**`fakeAsync`** crea una zona donde el tiempo es controlado manualmente.
**`tick(300)`** simula que pasaron 300ms. Esto es necesario porque nuestro
validador usa `debounceTime(300)` — sin el tick, el debounce nunca se resolveria.

#### 4. `expect.objectContaining` para verificaciones parciales

```typescript
expect(result).toEqual({
  passwordStrength: expect.objectContaining({ minLength: true }),
});
```

Esto verifica que el resultado contenga AL MENOS `minLength: true`,
sin importar si hay otros errores. Es util cuando solo te interesa verificar
un error especifico.

#### 5. Mock del servicio como parametro

```typescript
const userServiceMock = {
  checkUsernameAvailability: jest.fn(),
};
userServiceMock.checkUsernameAvailability.mockReturnValue(of(true));
```

El validador asincrono recibe el servicio como parametro (patron factory).
Esto hace que sea facil de testear: solo pasas un mock en vez del servicio real.

## Ejecutar los tests

```bash
pnpm test -- --testPathPattern="password-strength"
```
