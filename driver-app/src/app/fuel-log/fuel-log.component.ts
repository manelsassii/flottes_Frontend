// src/app/fuel-log/fuel-log.component.ts
import { Component, OnInit } from '@angular/core';
import { FuelService, FuelEntry } from '../services/fuel';
import { VehicleService } from '../services/vehicle';
import { Vehicle } from '../models/vehicle';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-fuel-log',
  templateUrl: './fuel-log.component.html',
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule] // AJOUTÉ RouterLink
})
export class FuelLogComponent implements OnInit {
  quantity = 0;
  refuelDate = new Date().toISOString().split('T')[0];
  cost = 0;
  odometer = 0;
  message = '';
  isSuccess = false;

  vehicles: Vehicle[] = [];
  selectedVehicleId: number | null = null;

  constructor(
    private fuelService: FuelService,
    private vehicleService: VehicleService,
  ) {}

  ngOnInit(): void {
    this.loadVehicles();
  }

  loadVehicles(): void {
    this.vehicleService.getAllVehicles().subscribe({
      next: (data: Vehicle[]) => {
        this.vehicles = data;
        if (data.length > 0) {
          this.selectedVehicleId = data[0].id;
        }
      },
      error: (err: any) => {
        this.message = 'Erreur: impossible de charger les véhicules';
        console.error(err);
      }
    });
  }

  saveFuel(): void {
    if (this.quantity <= 0 || !this.selectedVehicleId) {
      this.message = 'Véhicule ou quantité invalide !';
      return;
    }

    const isoDate = this.refuelDate + 'T00:00:00.000';

    const entry: FuelEntry = {
      quantity: this.quantity,
      refuelDate: isoDate,
      cost: this.cost || 0,
      odometerReading: this.odometer || 0,
      vehicleId: this.selectedVehicleId
    };

    this.fuelService.saveFuel(entry).subscribe({
      next: () => {
        this.isSuccess = true;
        this.message = 'Enregistré avec succès !';
        this.resetForm();
      },
      error: (err: any) => {
        this.message = 'Erreur : ' + (err.error?.message || 'Données invalides');
      }
    });
  }

  resetForm(): void {
    this.quantity = 0;
    this.cost = 0;
    this.odometer = 0;
    setTimeout(() => {
      this.isSuccess = false;
      this.message = '';
    }, 3000);
  }

  closeMenu() {
  const menu = document.querySelector('ion-menu');
  if (menu) menu.close();
}
}