import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { VehicleService } from '../vehicle.service';
import { FuelConsumptionService } from '../fuel-consumption.service';
import { Vehicle } from '../models/vehicle';
import { FuelConsumption } from '../models/fuel-consumption';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AlertService } from '../alert.service';

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './manager-dashboard.component.html',
  styleUrls: ['./manager-dashboard.component.css']
})
export class ManagerDashboardComponent implements OnInit {
  vehicles: Vehicle[] = [];
  fuelConsumptions: FuelConsumption[] = [];
  errorMessage: string | null = null;
  stats = {
    totalVehicles: 0,
    totalConsumption: 0,
    averageCost: 0
  };
  alerts: string[] = [];
  predictedConsumption: number | null = null;
  distanceKm: number = 0;
  username: string = '';
  showAlerts: boolean = false; // Nouvel état pour gérer l'affichage des alertes

  constructor(
    private authService: AuthService,
    private vehicleService: VehicleService,
    private fuelConsumptionService: FuelConsumptionService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.username = this.authService.getUsername() || 'Utilisateur';
    this.loadVehicles();
    this.loadFuelConsumptions();
    this.calculateStats();
    this.checkAlerts();
  }

  loadVehicles(): void {
    this.vehicleService.getAllVehicles().subscribe({
      next: (vehicles: Vehicle[]) => {
        this.vehicles = vehicles;
        this.stats.totalVehicles = vehicles.length;
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = err.message || 'Erreur lors du chargement des véhicules';
        this.toastr.error(this.errorMessage);
        console.error('Erreur:', err);
        this.cdr.detectChanges();
      }
    });
  }

  loadFuelConsumptions(): void {
    this.fuelConsumptionService.getAllConsumptions().subscribe({
      next: (consumptions: FuelConsumption[]) => {
        this.fuelConsumptions = consumptions;
        this.calculateStats();
        this.checkAlerts();
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = err.message || 'Erreur lors du chargement des consommations';
        this.toastr.error(this.errorMessage);
        console.error('Erreur:', err);
        this.cdr.detectChanges();
      }
    });
  }

  calculateStats(): void {
    if (this.fuelConsumptions.length > 0) {
      this.stats.totalConsumption = this.fuelConsumptions.reduce((sum, fc) => sum + (fc.quantity || 0), 0);
      this.stats.averageCost = this.fuelConsumptions.reduce((sum, fc) => sum + (fc.cost || 0), 0) / this.fuelConsumptions.length || 0;
    }
  }

  checkAlerts(): void {
    const threshold = 100;
    this.alerts = this.fuelConsumptions
      .filter(fc => fc.quantity && fc.quantity > threshold)
      .map(fc => `Consommation anormale pour le véhicule ${fc.vehicleId} : ${fc.quantity} ${fc.fuelType === 'Électrique' ? 'kWh' : 'litres'}`);
    console.log('Alertes envoyées au service:', this.alerts);
    if (this.alerts.length > 0) {
      this.alerts.forEach(alert => this.toastr.warning(alert));
      this.alertService.sendAlerts(this.alerts);
    }
    this.alertService.resolved$.subscribe(() => {
      this.alerts = [];
      this.toastr.success('Les anomalies ont été résolues par l\'admin.');
      this.cdr.detectChanges();
    });
  }

  predictConsumption(): void {
    if (!this.distanceKm || this.distanceKm <= 0) {
      this.toastr.error('Veuillez entrer une distance valide.');
      return;
    }
    const fuelTypeCount = this.fuelConsumptions.reduce((acc, fc) => {
      acc[fc.fuelType || ''] = (acc[fc.fuelType || ''] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
    const mostCommonFuelType = Object.entries(fuelTypeCount).reduce((a, b) => a[1] > b[1] ? a : b, ['', 0])[0] || 'Essence';

    this.fuelConsumptionService.predictConsumption(mostCommonFuelType, this.distanceKm).subscribe({
      next: (data: number) => {
        this.predictedConsumption = data;
        this.toastr.success(`Prédiction : ${data} ${mostCommonFuelType === 'Électrique' ? 'kWh' : 'litres'} pour ${this.distanceKm} km`);
      },
      error: (err: HttpErrorResponse) => {
        this.toastr.error(`Erreur lors de la prédiction : ${err.message}`);
        console.error('Erreur:', err);
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleAlerts(): void {
    this.showAlerts = !this.showAlerts;
  }
}