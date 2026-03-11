import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { LoginRequest, LoginResponse, RegisterRequest } from '../models/auth-model';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})

export class AuthService {

  private readonly baseUrl = `${environment.apiBaseUrl}/Auth`
  private readonly TOKEN_KEY = "auth_token";

  constructor(private http: HttpClient) { }

  login(data: LoginRequest) {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, data)
      .pipe(
        tap(response => {
          this.storeToken(response.token);
        })
      );
  }

  register(data: RegisterRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/register`, data);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  storeToken(token: string) {
    localStorage.setItem(this.TOKEN_KEY, token);
  }
}
