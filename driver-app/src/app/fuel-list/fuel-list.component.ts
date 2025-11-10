// src/app/fuel-list/fuel-list.component.ts
import { Component, OnInit } from '@angular/core';
import { FuelService, FuelEntry, Vehicle } from '../services/fuel';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-fuel-list',
  templateUrl: './fuel-list.component.html',
  standalone: true,
  imports: [IonicModule, CommonModule], // AJOUTÉ RouterLink
})
export class FuelListComponent implements OnInit {
  fuelEntries: (FuelEntry & { displayName?: string })[] = [];
  loading = true;

  private vehiclesMap = new Map<number, Vehicle>();

  constructor(private fuelService: FuelService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;

    // 1. CHARGE LES VÉHICULES
    this.fuelService.getVehicles().subscribe({
      next: (vehicles) => {
        vehicles.forEach(v => this.vehiclesMap.set(v.id, v));
        this.loadFuelEntries();
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  loadFuelEntries(): void {
    // 2. CHARGE LES CONSOMMATIONS
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
      }
    });
  }
}