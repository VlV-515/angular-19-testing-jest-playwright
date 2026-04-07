import { Component, inject } from '@angular/core';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'; //prettier-ignore
import { AuthService } from '../auth-service/auth.service';

interface LoginForm {
  email: FormControl<string>;
  password: FormControl<string>;
}
@Component({
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly authSvc = inject(AuthService);

  protected errorMessage: string | null = null;
  protected loginForm = this.fb.group<LoginForm>({
    email: this.fb.control('', Validators.required),
    password: this.fb.control('', Validators.required),
  });

  public onSubmit(): void {
    if (this.loginForm.invalid) return;

    const { email, password } = this.loginForm.getRawValue();

    this.authSvc.login(email, password).subscribe({
      next: () => {
        window.location.href = '/dashboard';
      },
      error: (err) => {
        this.errorMessage = err.error.message || 'Invalid credentials';
      },
    });
  }
}
