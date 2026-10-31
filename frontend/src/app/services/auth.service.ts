import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { AuthResponse, User } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  
  private currentUserSignal = signal<User | null>(this.getStoredUser());
  public currentUser = computed(() => this.currentUserSignal());
  public isAuthenticated = computed(() => !!this.currentUserSignal());
  public isAdmin = computed(() => this.currentUserSignal()?.role === 'ROLE_ADMIN');

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: { username: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res) => {
        const user: User = {
          id: res.id,
          username: res.username,
          fullName: res.fullName,
          email: res.email,
          role: res.role,
          token: res.token
        };
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUserSignal.set(user);
      })
    );
  }

  register(data: { username: string; email: string; password: string; fullName: string; role?: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap((res) => {
        const user: User = {
          id: res.id,
          username: res.username,
          fullName: res.fullName,
          email: res.email,
          role: res.role,
          token: res.token
        };
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUserSignal.set(user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSignal.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  private getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        return null;
      }
    }
    return null;
  }
}
