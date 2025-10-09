import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Driver } from './models/driver'; // Importe uniquement Driver
import { DriverRequest } from './models/driver'; // Importe DriverRequest

interface User {
  username: string;
  email: string;
  password: string;
  role: string;
}

interface Credentials {
  username: string;
  password: string;
}

interface LoginResponse {
  token?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8081/api';
  private token: string | null = null;
  private currentDriverId: number | null = null;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private toastr: ToastrService
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.token = localStorage.getItem('token');
      console.log('Token chargé au démarrage:', this.token);
    }
  }

  register(user: User): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/users/register`, user, { withCredentials: true }).pipe(
      tap(response => console.log('Inscription réussie:', response)),
      catchError(this.handleError)
    );
  }

  // Ajuste registerDriver pour accepter DriverRequest ou supprime si redondant
  registerDriver(driver: DriverRequest): Observable<{ message: string }> {
    const user: User = {
      username: driver.email, // Utilise l'email comme username
      email: driver.email,
      password: driver.password || 'defaultPassword', // Utilise le password fourni ou un défaut
      role: 'DRIVER'
    };
    return this.http.post<{ message: string }>(`${this.apiUrl}/users/register`, user, { withCredentials: true }).pipe(
      tap(response => {
        console.log('Conducteur enregistré:', response);
      }),
      catchError(this.handleError)
    );
  }

  login(credentials: Credentials): Observable<LoginResponse> {
    return this.http.post(`${this.apiUrl}/auth/login`, credentials).pipe(
      map((response: any) => {
        console.log('Payload brut:', response);
        const parsedResponse: LoginResponse = {};
        if (response.token) {
          parsedResponse.token = response.token;
        } else if (response.error) {
          parsedResponse.error = response.error;
        }
        return parsedResponse;
      }),
      tap((response: LoginResponse) => {
        console.log('Parsed response:', response);
        if (response.token && !response.error) {
          this.token = response.token;
          if (isPlatformBrowser(this.platformId) && this.token) {
            localStorage.setItem('token', this.token);
            console.log('Connexion réussie, token stocké:', this.token);
            const driverId = this.getCurrentDriverId();
            if (!driverId) {
              console.warn('Aucun ID conducteur détecté dans le token.');
            }
            this.redirectBasedOnRole();
          }
        } else if (response.error) {
          console.error('Erreur dans la réponse:', response.error);
          throw new Error(response.error);
        } else {
          console.error('Réponse inattendue:', response);
          throw new Error('Aucun token ou erreur non définie');
        }
      }),
      catchError(this.handleError)
    );
  }

  logout(): void {
    this.token = null;
    this.currentDriverId = null;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
    }
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      this.token = localStorage.getItem('token');
      console.log('Vérification isLoggedIn, token:', this.token);
      return !!this.token;
    }
    return false;
  }

  getToken(): string | null {
    return this.token;
  }

  getUserRole(): string | null {
    const token = this.getToken();
    if (!token) {
      console.log('Aucun token disponible pour obtenir le rôle');
      return null;
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('Payload JWT décodé:', payload);
      const role = payload.role ? payload.role.replace(/ROLE_/g, '') : null;
      console.log('Rôle extrait:', role);
      return role;
    } catch (error) {
      console.error('Erreur lors du décodage du token JWT:', error);
      return null;
    }
  }

  getUsername(): string | null {
    const token = isPlatformBrowser(this.platformId) ? localStorage.getItem('token') : null;
    if (token) {
      try {
        const payload = token.split('.')[1];
        const decoded = atob(payload);
        const parsed = JSON.parse(decoded);
        return parsed.sub || parsed.username;
      } catch (error) {
        console.error('Erreur lors du décodage du username:', error);
        return null;
      }
    }
    return null;
  }

  getCurrentDriverId(): number | null {
    if (this.currentDriverId) {
      return this.currentDriverId;
    }
    const token = this.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.currentDriverId = payload.sub || payload.id || null;
        if (this.currentDriverId) {
          console.log('ID conducteur extrait du token:', this.currentDriverId);
          return this.currentDriverId;
        }
      } catch (error) {
        console.error('Erreur lors du décodage de l\'ID du conducteur:', error);
      }
    }
    console.warn('Aucun ID conducteur trouvé dans le token. Une requête API pourrait être nécessaire.');
    return null;
  }

  getAuthHeaders(): HttpHeaders {
    let token = '';
    if (isPlatformBrowser(this.platformId)) {
      token = localStorage.getItem('token') || '';
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getUserInfo(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/me`, { headers: this.getAuthHeaders() }).pipe(
      tap(response => console.log('Infos utilisateur:', response)),
      catchError(this.handleError)
    );
  }

  private redirectBasedOnRole(): void {
    const role = this.getUserRole();
    console.log('Rôle détecté pour redirection:', role);
    if (role === 'ADMIN') {
      this.router.navigate(['/admin/dashboard']);
    } else if (role === 'MANAGER') {
      this.router.navigate(['/manager/dashboard']);
    } else {
      this.toastr.error('Rôle inconnu. Veuillez contacter l\'administrateur.');
      this.logout();
    }
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Erreur complète:', error);
    let errorMessage = 'Erreur serveur';
    if (error.status === 0) {
      errorMessage = 'Impossible de contacter le serveur (CORS ou serveur arrêté)';
    } else if (error.status === 401) {
      errorMessage = 'Non autorisé : identifiants incorrects';
    } else if (error.status === 403) {
      errorMessage = 'Accès interdit';
    } else if (error.status === 404) {
      errorMessage = 'Endpoint non trouvé';
    } else if (error.status === 400) {
      errorMessage = error.error?.message || 'Requête invalide';
    } else {
      errorMessage = error.error?.message || error.message || 'Erreur serveur';
    }
    this.toastr.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}