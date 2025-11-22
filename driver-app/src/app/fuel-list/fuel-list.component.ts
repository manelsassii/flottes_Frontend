// src/app/fuel-list/fuel-list.component.ts
import { Component, OnInit } from '@angular/core';
import { FuelService, FuelEntry, Vehicle } from '../services/fuel';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-fuel-list',
  templateUrl: './fuel-list.component.html',
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class FuelListComponent implements OnInit {
  fuelEntries: (FuelEntry & { displayName?: string })[] = [];
  loading = true;

  private vehiclesMap = new Map<number, Vehicle>();

  constructor(
    private fuelService: FuelService,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(event?: any): void {
    this.loading = true;

    this.fuelService.getVehicles().subscribe({
      next: (vehicles) => {
        vehicles.forEach(v => this.vehiclesMap.set(v.id, v));
        this.loadFuelEntries();
      },
      error: () => {
        this.loading = false;
        this.completeRefresh(event);
      }
    });
  }

  private loadFuelEntries(): void {
    this.fuelService.getAllFuel().subscribe({
      next: (entries) => {
        this.fuelEntries = entries.map(entry => {
          const vehicle = this.vehiclesMap.get(entry.vehicleId);
          const displayName = vehicle
            ? `${vehicle.licensePlate} (${vehicle.brand} ${vehicle.model})`
            : `Véhicule #${entry.vehicleId}`;
          return { ...entry, displayName };
        });
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
      complete: () => this.completeRefresh()
    });
  }

  private completeRefresh(event?: any) {
    if (event) {
      event.target.complete();
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}