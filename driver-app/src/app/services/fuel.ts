// src/app/services/fuel.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators'; // AJOUTÉ ICI

export interface FuelEntry {
  id?: number;
  quantity: number;
  refuelDate: string;
  cost?: number;
  odometerReading?: number;
  vehicleId: number;
  fuelType?: string;
}

export interface Vehicle {
  id: number;
  licensePlate: string;
  brand: string;
  model: string;
  fuelType: string;
}

// Alerte générée localement
export interface LocalAlert {
  message: string;
  date: string;
  type: 'odometer' | 'consumption';
  read: boolean;
}

@Injectable({ providedIn: 'root' })
export class FuelService {
  private apiUrl = '/api/fuel-consumptions';
  private vehicleUrl = '/api/vehicles';

  // Stockage local des alertes
  private alertsSubject = new BehaviorSubject<LocalAlert[]>([]);
  alerts$ = this.alertsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadAlertsFromStorage();
  }

  saveFuel(entry: FuelEntry): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, entry).pipe(
      tap(() => {
        this.checkAnomalies(entry);
      })
    );
  }

  getAllFuel(): Observable<FuelEntry[]> {
    return this.http.get<FuelEntry[]>(this.apiUrl);
  }

  getVehicles(): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(this.vehicleUrl);
  }

  private checkAnomalies(newEntry: FuelEntry) {
    if (!newEntry.odometerReading || newEntry.odometerReading <= 0) return;

    this.getAllFuel().subscribe(entries => {
      const vehicleEntries = entries
        .filter(e => e.vehicleId === newEntry.vehicleId && e.odometerReading)
        .sort((a, b) => new Date(b.refuelDate).getTime() - new Date(a.refuelDate).getTime());

      const prev = vehicleEntries[1];

      // 1. ODOMÈTRE DÉCROISSANT
      if (prev && newEntry.odometerReading! < prev.odometerReading!) {
        this.addLocalAlert(
          `Odomètre décroissant : ${newEntry.odometerReading} < ${prev.odometerReading}`,
          newEntry.refuelDate,
          'odometer'
        );
      }

      // 2. CONSOMMATION ANORMALE
      if (prev && prev.odometerReading) {
        const km = newEntry.odometerReading! - prev.odometerReading!;
        if (km > 0) {
          const consumption = (newEntry.quantity / km) * 100;
          if (consumption > 20) {
            this.addLocalAlert(
              `Consommation anormale : ${consumption.toFixed(1)} L/100km`,
              newEntry.refuelDate,
              'consumption'
            );
          }
        }
      }
    });
  }

  // AJOUTE UNE ALERTE LOCALEMENT
  private addLocalAlert(message: string, date: string, type: 'odometer' | 'consumption') {
    const newAlert: LocalAlert = {
      message,
      date: date.split('T')[0],
      type,
      read: false
    };

    const current = this.alertsSubject.value;
    const updated = [newAlert, ...current];
    this.alertsSubject.next(updated);
    this.saveAlertsToStorage(updated);
  }

  // MARQUER COMME LU
  markAsRead(index: number) {
    const alerts = [...this.alertsSubject.value];
    if (alerts[index]) {
      alerts[index].read = true;
      this.alertsSubject.next(alerts);
      this.saveAlertsToStorage(alerts);
    }
  }

  // CHARGER / SAUVEGARDER DANS localStorage
  private saveAlertsToStorage(alerts: LocalAlert[]) {
    localStorage.setItem('agilfleet-alerts', JSON.stringify(alerts));
  }

  private loadAlertsFromStorage() {
    const data = localStorage.getItem('agilfleet-alerts');
    if (data) {
      this.alertsSubject.next(JSON.parse(data));
    }
  }
}