import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);

  //Simula metodo de login que retorna del backend un token de auteticacion
  public login(email: string, password: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>('/api/login', { email, password }); //prettier-ignore
  }
}
