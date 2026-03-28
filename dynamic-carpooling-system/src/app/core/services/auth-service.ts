import { HttpClient } from '@angular/common/http';
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { LoginRequest, LoginResponse, RegisterRequest, UserRole, JwtPayload, PinRequest } from '../models/auth-model';
import { environment } from '../environments/environment';
import { jwtDecode } from 'jwt-decode';
import { SignalrService } from './signalr';
import { DriverRideService } from '../../features/driver/services/driver-ride-service';
import { PassengerRideService } from './passenger-ride-service';

@Injectable({
  providedIn: 'root'
})

export class AuthService {
  private readonly baseUrl = `${environment.apiBaseUrl}/Auth`
  private readonly TOKEN_KEY = "auth_token";
  private userRoleSubject = new BehaviorSubject<UserRole | null>(null);
  loggedInUserRole = this.userRoleSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
    private signalrService: SignalrService,
    private passengerService: PassengerRideService,
    private driverRideService: DriverRideService
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.loadUserFromToken();
    }
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  login(data: LoginRequest) {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, data)
      .pipe(
        tap(response => {
          this.storeToken(response.token);
          setTimeout(() => this.signalrService.connect(), 500);
        })
      );
  }

  register(data: RegisterRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/register`, data);
  }

  logout(): void {
    if (this.isBrowser()) {
      this.signalrService.disconnect();
      localStorage.removeItem(this.TOKEN_KEY);
      this.passengerService.clearAll();
      this.driverRideService.clearAll();
      this.userRoleSubject.next(null);
    }
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    if (!this.isBrowser()) {
      return null;
    }

    return localStorage.getItem(this.TOKEN_KEY);
  }

  storeToken(token: string) {
    if (this.isBrowser()) {
      localStorage.setItem(this.TOKEN_KEY, token);
      this.loadUserFromToken();
    }
  }

  decodeToken(token: string): JwtPayload | null {
    if (!token) {
      return null;
    }

    try {
      const decodedToken = jwtDecode<JwtPayload>(token);
      return decodedToken;
    } catch (Error) {
      return null;
    }
  }

  loadUserFromToken() {
    const token = this.getToken();

    if (!token) {
      return;
    }

    const payload = this.decodeToken(token);

    if (payload && payload.role) {
      let roleEnum: UserRole;

      switch (payload.role) {
        case 'Passenger':
          roleEnum = UserRole.Passenger;
          break;
        case 'Driver':
          roleEnum = UserRole.Driver;
          break;
        default:
          return;
      }

      this.userRoleSubject.next(roleEnum);
    }
  }

  getUserRole() {
    return this.userRoleSubject.getValue();
  }

  getMyPin(): Observable<PinRequest> {
    return this.http.get<PinRequest>(`${environment.apiBaseUrl}/user/my-pin`);
  }
}
