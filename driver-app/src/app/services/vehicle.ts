// src/app/services/vehicle.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Vehicle } from '../models/vehicle';

@Injectable({
  providedIn: 'root'
})
export class VehicleService {
  private apiUrl = '/api/vehicles';  // PROXY → localhost:8081

  constructor(private http: HttpClient) {}

  getAllVehicles(): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(this.apiUrl);
  }
}