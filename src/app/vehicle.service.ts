import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { Vehicle } from './models/vehicle';

// Interface temporaire pour le payload
interface VehiclePayload {
    id?: number;
    licensePlate: string;
    brand: string;
    model: string;
    fuelType: string;
    year: number;
    client: { id: number };
}

@Injectable({
    providedIn: 'root'
})
export class VehicleService {
    private apiUrl = 'http://localhost:8081/api/vehicles';

    constructor(private http: HttpClient) {}

    getAllVehicles(): Observable<Vehicle[]> {
        console.log('Envoi de la requête GET /api/vehicles');
        return this.http.get<Vehicle[]>(this.apiUrl, { observe: 'response' }).pipe(
            tap(response => console.log('Réponse brute GET /api/vehicles:', response)),
            map((response: HttpResponse<Vehicle[]>) => {
                console.log('Corps de la réponse GET /api/vehicles:', response.body);
                return response.body ?? [];
            }),
            catchError(this.handleError)
        );
    }

    createVehicle(vehicle: Vehicle | VehiclePayload): Observable<Vehicle> {
        console.log('Payload envoyé pour POST /api/vehicles:', vehicle);
        return this.http.post<Vehicle>(this.apiUrl, vehicle, { observe: 'response' }).pipe(
            tap(response => console.log('Réponse brute POST /api/vehicles:', response)),
            map((response: HttpResponse<Vehicle>) => {
                if (!response.body) {
                    throw new Error('Réponse vide reçue du serveur');
                }
                return response.body;
            }),
            catchError(this.handleError)
        );
    }

    updateVehicle(id: number, vehicle: Vehicle | VehiclePayload): Observable<Vehicle> {
        console.log('Envoi de la requête PUT /api/vehicles/' + id, vehicle);
        return this.http.put<Vehicle>(`${this.apiUrl}/${id}`, vehicle, { observe: 'response' }).pipe(
            tap(response => console.log('Réponse brute PUT /api/vehicles/' + id + ':', response)),
            map((response: HttpResponse<Vehicle>) => {
                console.log('Corps de la réponse PUT /api/vehicles/' + id + ':', response.body);
                if (!response.body) {
                    throw new Error('Réponse vide reçue du serveur');
                }
                return response.body;
            }),
            catchError(this.handleError)
        );
    }

    deleteVehicle(id: number): Observable<void> {
        console.log('Envoi de la requête DELETE /api/vehicles/' + id);
        return this.http.delete(`${this.apiUrl}/${id}`, { observe: 'response', responseType: 'text' }).pipe(
            tap(response => console.log('Réponse brute DELETE /api/vehicles/' + id + ':', response)),
            map(() => undefined),
            catchError(this.handleError)
        );
    }

    private handleError(error: HttpErrorResponse): Observable<never> {
        let errorMessage = 'Erreur lors de l\'opération';
        console.error('Erreur complète:', error);
        if (error.status === 403) {
            errorMessage = 'Accès interdit : Vérifiez votre authentification ou vos permissions.';
        } else if (error.status === 400) {
            errorMessage = 'Erreur de données : ' + (error.error?.message || JSON.stringify(error.error) || 'Données invalides');
        } else if (error.status === 500) {
            errorMessage = 'Erreur serveur : ' + (error.error?.message || JSON.stringify(error.error) || 'Erreur inconnue');
        } else if (error.status === 200 && !error.ok) {
            errorMessage = 'Erreur serveur : Réponse inattendue - ' + (error.error?.text || JSON.stringify(error.error) || 'Contenu non valide');
        } else if (error.status === 0) {
            errorMessage = 'Erreur réseau : Impossible de contacter le serveur. Vérifiez votre connexion ou l\'URL du serveur.';
        }
        return throwError(() => new Error(errorMessage));
    }

    getVehicleById(id: number): Observable<Vehicle> {
  console.log('Envoi de la requête GET /api/vehicles/' + id);
  return this.http.get<Vehicle>(`${this.apiUrl}/${id}`, { observe: 'response' }).pipe(
    tap(response => console.log('Réponse brute GET /api/vehicles/' + id + ':', response)),
    map((response: HttpResponse<Vehicle>) => {
      if (!response.body) {
        throw new Error('Réponse vide reçue du serveur');
      }
      return response.body;
    }),
    catchError(this.handleError)
  );
}
}