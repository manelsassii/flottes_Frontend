import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { Client } from './models/client';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class ClientService {
    private apiUrl = 'http://localhost:8081/api/clients'; // Ajusté pour correspondre à ClientController

    constructor(private http: HttpClient, private authService: AuthService) {}

    private getHeaders(): HttpHeaders {
        const token = this.authService.getToken();
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        });
    }

    getAllClients(): Observable<Client[]> {
        console.log('Envoi de la requête GET /api/clients');
        return this.http.get<Client[]>(this.apiUrl, { headers: this.getHeaders(), observe: 'response' }).pipe(
            tap(response => console.log('Réponse brute GET /api/clients:', response)),
            map((response: HttpResponse<Client[]>) => {
                console.log('Corps de la réponse GET /api/clients:', response.body);
                const clients = response.body ?? [];
                return clients.map(client => ({
                    ...client,
                    id: client.id !== undefined ? client.id : 0
                }));
            }),
            catchError(this.handleError)
        );
    }

    createClient(client: Client): Observable<Client> {
        console.log('Payload envoyé pour POST /api/clients:', client);
        return this.http.post<Client>(this.apiUrl, client, { headers: this.getHeaders(), observe: 'response' }).pipe(
            tap(response => console.log('Réponse brute POST /api/clients:', response)),
            map((response: HttpResponse<Client>) => {
                if (!response.body) {
                    throw new Error('Réponse vide reçue du serveur');
                }
                return response.body;
            }),
            catchError(this.handleError)
        );
    }

    updateClient(id: number, client: Client): Observable<Client> {
        console.log('Envoi de la requête PUT /api/clients/' + id, client);
        return this.http.put<Client>(`${this.apiUrl}/${id}`, client, { headers: this.getHeaders(), observe: 'response' }).pipe(
            tap(response => console.log('Réponse brute PUT /api/clients/' + id + ':', response)),
            map((response: HttpResponse<Client>) => {
                console.log('Corps de la réponse PUT /api/clients/' + id + ':', response.body);
                if (!response.body) {
                    throw new Error('Réponse vide reçue du serveur');
                }
                return response.body;
            }),
            catchError(this.handleError)
        );
    }

    deleteClient(id: number): Observable<void> {
        console.log('Envoi de la requête DELETE /api/clients/' + id);
        return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders(), observe: 'response' }).pipe(
            tap(response => console.log('Réponse brute DELETE /api/clients/' + id + ':', response)),
            map(() => undefined),
            catchError((error: HttpErrorResponse) => {
                let errorMessage = 'Erreur lors de la suppression';
                if (error.error && typeof error.error === 'object' && error.error.message) {
                    errorMessage = error.error.message;
                } else if (error.error) {
                    errorMessage = `Erreur : ${error.error}`;
                }
                console.error('Erreur complète:', error);
                return throwError(() => new Error(errorMessage));
            })
        );
    }

    private handleError(error: HttpErrorResponse): Observable<never> {
        let errorMessage = 'Erreur lors de l\'opération';
        console.error('Erreur complète:', error);
        if (error.status === 403) {
            errorMessage = 'Accès interdit : Vérifiez votre authentification ou vos permissions. Contactez le backend si le problème persiste.';
        } else if (error.status === 400) {
            errorMessage = 'Erreur de données : ' + (error.error?.message || JSON.stringify(error.error) || 'Données invalides');
        } else if (error.status === 500) {
            errorMessage = 'Erreur serveur : ' + (error.error?.message || JSON.stringify(error.error) || 'Erreur inconnue');
        } else if (error.status === 0) {
            errorMessage = 'Erreur réseau : Impossible de contacter le serveur. Vérifiez votre connexion ou l\'URL du serveur.';
        }
        return throwError(() => new Error(errorMessage));
    }
}