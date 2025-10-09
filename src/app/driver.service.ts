import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Driver } from './models/driver';
import { DriverRequest } from './models/driver';
import { DriverResponse } from './driver-management/driver-management.component'; // Ajuste le chemin

@Injectable({
  providedIn: 'root'
})
export class DriverService {
  private apiUrl = 'http://localhost:8081/api/drivers';

  constructor(private http: HttpClient) {}

  getAllDrivers(): Observable<Driver[]> {
    return this.http.get<Driver[]>(this.apiUrl);
  }

  getDriverById(id: number): Observable<Driver> {
    return this.http.get<Driver>(`${this.apiUrl}/${id}`);
  }

  createDriver(driver: DriverRequest): Observable<DriverResponse> {
    return this.http.post<DriverResponse>(`${this.apiUrl}`, driver);
  }

  updateDriver(id: number, driver: Driver): Observable<Driver> {
    return this.http.put<Driver>(`${this.apiUrl}/${id}`, driver);
  }

  deleteDriver(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}