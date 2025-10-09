import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api/auth'; // Doit être proxyfié vers http://localhost:8081/api/auth
  private tokenKey = 'auth_token';

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<any> {
    const fullUrl = `http://localhost:8100${this.apiUrl}/login`; // Pour débogage
    console.log('Tentative de login avec URL:', fullUrl, 'Email:', email);
    return this.http.post(`${this.apiUrl}/login`, { username: email, password }).pipe(
      tap((response: any) => {
        console.log('Réponse API login:', response);
        if (response.token) {
          localStorage.setItem(this.tokenKey, response.token);
          localStorage.setItem('user_email', email);
        } else {
          throw new Error('Aucun token reçu de l\'API');
        }
      }),
      catchError(error => {
        console.error('Erreur API:', error);
        return throwError(() => new Error(error.error || 'Échec de la connexion'));
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