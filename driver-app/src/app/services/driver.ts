// src/app/services/driver.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DriverService {
  private apiUrl = 'http://localhost:8081/api/drivers';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  getMyVehicles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/my-vehicles`, { headers: this.getHeaders() });
  }
}