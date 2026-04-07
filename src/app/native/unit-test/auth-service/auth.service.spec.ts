import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'; //prettier-ignore
import { firstValueFrom } from 'rxjs';

//Se pueden trabajar dos formas de escribir pruebas:
//1. Cada test es independiente, se puede ejecutar de forma aislada
//2. Cada test depende del anterior, se ejecutan en orden, no se pueden ejecutar de forma aislada (No es recomendada pero si es más comoda para cosas relacionadas)

describe('AuthService', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;

  //? Antes de cada prueba (it) se ejecuta este bloque de codigo (beforeEach)
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withFetch()) /* Para realizar peticiones */,
        provideHttpClientTesting() /* Para mockear esas peticiones */,
        AuthService /* Servicio a probar */,
      ],
    });

    service = TestBed.inject(AuthService); // Inyectamos el servicio para poder usarlo en las pruebas
    httpTesting = TestBed.inject(HttpTestingController); // Permite intercepar las peticiones y mockearlas
  });

  //? Despues de cada prueba se ejecuta este bloque de codigo (afterEach)
  afterEach(() => {
    httpTesting.verify(); /* Verifica que no haya peticiones pendientes */
  });

  //? Esto debería ... => it should ...
  it('should login correctly', async () => {
    //! Given (Dado que) [Data, Mock, etc]
    const email = 'email@example.com';
    const password = 'pass123';
    const mockResponse = { token: 'mocked-jwt-token' };

    //! When (Cuando) [Funcionalidades a probar]
    const login$ = service.login(email, password); // Llamamos al metodo de login que queremos probar
    const loginPromise = firstValueFrom(login$); // Convertimos el Observable a Promise para que se ejecute la suscripcion y se realice la peticion
    const req = httpTesting.expectOne('/api/login'); // Simulamos la salida de la peticion

    //! Then (Entonces) [Resultados esperados]
    expect(req.request.method).toBe('POST'); // Verificamos que la peticion sea un POST
    expect(req.request.body).toEqual({ email, password }); // Verificamos que el body de la peticion sea el esperado
    req.flush(mockResponse); // Simulamos la respuesta exitosa del backend con el token mockeado

    expect(await loginPromise).toEqual(mockResponse); // Verificamos que la respuesta del metodo login sea la esperada (el token mockeado)
  });
});
