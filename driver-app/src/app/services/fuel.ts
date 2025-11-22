// src/app/services/fuel.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

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

export interface LocalAlert {
  message: string;
  date: string;
  read: boolean;
}

@Injectable({ providedIn: 'root' })
export class FuelService {
  private apiUrl = '/api/fuel-consumptions';
  private vehicleUrl = '/api/vehicles';
  private anomalyUrl = '/api/anomalies'; // Endpoint anomalies

  private alertsSubject = new BehaviorSubject<LocalAlert[]>([]);
  alerts$ = this.alertsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadFromStorage();
  }

  // ENREGISTREMENT CARBURANT
  saveFuel(entry: FuelEntry): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, entry).pipe(
      tap(() => this.checkAnomalies(entry))
    );
  }

  // LISTE TOUS LES RAVITAILLEMENTS
  getAllFuel(): Observable<FuelEntry[]> {
    return this.http.get<FuelEntry[]>(this.apiUrl);
  }

  // LISTE VÉHICULES
  getVehicles(): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(this.vehicleUrl);
  }

  // SIGNALER UNE ANOMALIE (MÉTHODE PUBLIQUE)
  reportAnomaly(payload: any): Observable<any> {
    return this.http.post(`${this.anomalyUrl}/report`, payload);
  }

  // DÉTECTION ANOMALIES
  private checkAnomalies(newEntry: FuelEntry) {
    if (!newEntry.odometerReading || newEntry.odometerReading <= 0) return;

    this.getAllFuel().subscribe(entries => {
      const vehicleEntries = entries
        .filter(e => e.vehicleId === newEntry.vehicleId && e.odometerReading)
        .sort((a, b) => new Date(b.refuelDate).getTime() - new Date(a.refuelDate).getTime());

      const prev = vehicleEntries[1];

      if (prev && newEntry.odometerReading! < prev.odometerReading!) {
        this.addAlert(`Odomètre décroissant : ${newEntry.odometerReading} < ${prev.odometerReading}`);
      }

      if (prev && prev.odometerReading) {
        const km = newEntry.odometerReading! - prev.odometerReading!;
        if (km > 0) {
          const consumption = (newEntry.quantity / km) * 100;
          if (consumption > 20) {
            this.addAlert(`Consommation anormale : ${consumption.toFixed(1)} L/100km`);
          }
        }
      }
    });
  }

  // AJOUTER ALERTE
  addAlert(message: string) {
    const newAlert: LocalAlert = {
      message,
      date: new Date().toISOString().split('T')[0],
      read: false
    };
    const current = this.alertsSubject.value;
    this.alertsSubject.next([newAlert, ...current]);
    this.saveToStorage();
  }

  // MARQUER COMME LUE
  markAsRead(index: number) {
    const alerts = [...this.alertsSubject.value];
    if (alerts[index]) {
      alerts[index].read = true;
      this.alertsSubject.next(alerts);
      this.saveToStorage();
    }
  }

  // SAUVEGARDE LOCAL
  private saveToStorage() {
    localStorage.setItem('agilfleet-alerts', JSON.stringify(this.alertsSubject.value));
  }

  private loadFromStorage() {
    const data = localStorage.getItem('agilfleet-alerts');
    if (data) this.alertsSubject.next(JSON.parse(data));
  }
}