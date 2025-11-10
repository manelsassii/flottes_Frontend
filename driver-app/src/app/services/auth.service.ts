// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api/auth'; // PROXY
  private tokenKey = 'auth_token';

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<any> {
    console.log('Tentative de login avec URL:', this.apiUrl + '/login');
    return this.http.post(`${this.apiUrl}/login`, { username: email, password }).pipe(
      tap((response: any) => {
        console.log('Réponse API login:', response);
        if (response.token) {
          localStorage.setItem(this.tokenKey, response.token);
          localStorage.setItem('user_email', email);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem('user_email');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  getUserEmail(): string | null {
    return localStorage.getItem('user_email');
  }
}