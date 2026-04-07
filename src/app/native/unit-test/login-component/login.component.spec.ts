import { LoginComponent } from './login.component';
import { AuthService } from '../auth-service/auth.service';
import { of, throwError } from 'rxjs';
import { userEvent } from '@testing-library/user-event';
import { render, screen } from '@testing-library/angular';

describe('LoginComponent', () => {
  let authSvcMock: jest.Mocked<AuthService>; // Nuestro componente necesita de un service (authSvc), por lo tanto hay que generarlo (inventarlo)

  //? Antes de cada prueba (it) se ejecuta este bloque de codigo (beforeEach)
  beforeEach(async () => {
    authSvcMock = { login: jest.fn() } as unknown as jest.Mocked<AuthService>; // Creamos un mock de nuestro service

    //! Creamos mock de window.location para manjear la redireccion
    delete (window as any).location;
    window.location = { href: '' } as any;
  });

  //? Esto debería ... => it should ...
  it('should redirect to dashboard if user is logged', async () => {
    //! Given (Dado que) [Data, Mock, etc]
    const email = 'email@example.com';
    const password = 'pass123';

    authSvcMock.login.mockReturnValueOnce(of({ token: 'token-mock' })); // Simulamos que el login nos devuelve un token

    // Renderizamos el componente sustituyendo el service por el mock
    await render(LoginComponent, {
      providers: [{ provide: AuthService, useValue: authSvcMock }], // Inyectamos el mock
    });

    //! When (Cuando) [Funcionalidades a probar]
    /*
    ? Tenemos 2 opciones en este caso: fireEvent & user-event
    ? fireEvent es una herramienta que nos permite simular eventos del DOM
    ? user-event es una herramienta que nos permite simular interacciones del usuario
    */

    //* Simulamos el ingreso de email, password y click (fireEvent)
    // await fireEvent.input(screen.getByPlaceholderText('Email'), { target: { value: email } }); //prettier-ignore
    // await fireEvent.input(screen.getByPlaceholderText('Password'), { target: { value: password } }); //prettier-ignore
    // await fireEvent.click(screen.getByRole('button', { name: /login/i })); //prettier-ignore

    // Simulamos el ingreso de email, password y click (user-event)
    await userEvent.type(screen.getByPlaceholderText('Email'), email); //prettier-ignore
    await userEvent.type(screen.getByPlaceholderText('Password'), password); //prettier-ignore
    await userEvent.click(screen.getByRole('button', { name: /login/i })); //prettier-ignore

    //! Then (Entonces) [Resultados esperados]
    expect(authSvcMock.login).toHaveBeenCalledWith(email, password); // Verificamos que el login se haya llamado con los valores esperados
    expect(window.location.href).toBe('/dashboard'); // Verificamos que la redireccion sea la esperada
  });

  it('should show error message if login fails', async () => {
    //! Given (Dado que) [Data, Mock, etc]
    const email = 'email@example.com';
    const password = 'pass123';

    // Simulamos que el login nos devuelve un error
    authSvcMock.login.mockReturnValueOnce(
      throwError(() => ({ error: { message: 'Credentials error' } })),
    );

    // Renderizamos el componente sustituyendo el service por el mock
    await render(LoginComponent, {
      providers: [{ provide: AuthService, useValue: authSvcMock }], // Inyectamos el mock
    });

    //! When (Cuando) [Funcionalidades a probar]
    /*
    ? Tenemos 2 opciones en este caso: fireEvent & user-event
    ? fireEvent es una herramienta que nos permite simular eventos del DOM
    ? user-event es una herramienta que nos permite simular interacciones del usuario
    */

    //* Simulamos el ingreso de email, password y click (fireEvent)
    // await fireEvent.input(screen.getByPlaceholderText('Email'), { target: { value: email } }); //prettier-ignore
    // await fireEvent.input(screen.getByPlaceholderText('Password'), { target: { value: password } }); //prettier-ignore
    // await fireEvent.click(screen.getByRole('button', { name: /login/i })); //prettier-ignore

    // Simulamos el ingreso de email, password y click (user-event)
    await userEvent.type(screen.getByPlaceholderText('Email'), email); //prettier-ignore
    await userEvent.type(screen.getByPlaceholderText('Password'), password); //prettier-ignore
    await userEvent.click(screen.getByRole('button', { name: /login/i })); //prettier-ignore

    //! Then (Entonces) [Resultados esperados]
    expect(authSvcMock.login).toHaveBeenCalledWith(email, password); // Verificamos que el login se haya llamado con los valores esperados

    const errorMessage = await screen.findByText('Credentials error'); // Obtenemos el mensaje de error
    expect(errorMessage).toBeTruthy(); // Verificamos que el mensaje de error exista
    expect(errorMessage).toBeInTheDocument(); // Verificamos que el mensaje de error este en el DOM
  });
});
