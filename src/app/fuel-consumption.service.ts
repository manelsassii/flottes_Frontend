import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FuelConsumption } from './models/fuel-consumption'; // Assure-toi que ce modèle existe

@Injectable({
  providedIn: 'root'
})
export class FuelConsumptionService {
  private apiUrl = 'http://localhost:8081/api/fuel-consumptions';

  constructor(private http: HttpClient) {}

  getAllConsumptions(): Observable<FuelConsumption[]> {
    return this.http.get<FuelConsumption[]>(this.apiUrl);
  }

  predictConsumption(fuelType: string, distanceKm: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/predict?fuelType=${fuelType}&distanceKm=${distanceKm}`);
  }
}