import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http'; // ← AJOUTÉ
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
import { jsPDF } from 'jspdf';



@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './manager-dashboard.component.html',
  styleUrls: ['./manager-dashboard.component.css']
})

export class ManagerDashboardComponent implements OnInit {
  // INJECTION MODERNE (Angular 14+)
  private http = inject(HttpClient); // ← CORRIGÉ : http injecté proprement
  private authService = inject(AuthService);
  private vehicleService = inject(VehicleService);
  private fuelConsumptionService = inject(FuelConsumptionService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private toastr = inject(ToastrService);
  private alertService = inject(AlertService);

  

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
  showAlerts: boolean = false;
  selectedVehicleId: number = 1;
  pythonPrediction: any = null;
  isLoadingPython = false;
  

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
      }
    });
  }

  // ← MÉTHODE CORRIGÉE AVEC TYPAGE
  launchPythonPrediction(): void {
    if (!this.selectedVehicleId || this.selectedVehicleId <= 0) {
      this.toastr.error('Veuillez entrer un ID de véhicule valide');
      return;
    }

    this.isLoadingPython = true;
    this.pythonPrediction = null;

    this.http.get<any>(`http://localhost:8081/api/fuel-consumptions/python-predict/${this.selectedVehicleId}`)
      .subscribe({
        next: (result: any) => { // ← Typé explicitement
          this.pythonPrediction = result;
          this.isLoadingPython = false;

          if (result.error) {
            this.toastr.error('IA Python : ' + result.error);
          } else if (result.anomaly_detected) {
            this.toastr.warning('Anomalie détectée sur le véhicule ' + this.selectedVehicleId);
          } else {
            this.toastr.success('Prédiction IA réussie pour le véhicule ' + this.selectedVehicleId);
          }
        },
        error: (err: any) => { // ← Typé explicitement
          this.isLoadingPython = false;
          this.pythonPrediction = { error: "Impossible de contacter l'IA Python" };
          this.toastr.error('Erreur de connexion à l\'IA Python');
          console.error(err);
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

   exportToPDF(): void {
  const doc = new jsPDF('p', 'mm', 'a4');
  let y = 20;

  // === ON COMMENCE DIRECT, PAS D'ATTENTE ===
  try {
    // Logo local (marche même sans internet)
    doc.addImage('assets/images/agil-logo.gif', 'GIF', 15, 10, 40, 40);
  } catch (e) {
    // Si jamais le logo ne charge pas → on continue quand même
    doc.setFontSize(24);
    doc.text('RAPPORT AGIL FLEET - SNDP', 20, 30);
    y = 50;
  }

  // === EN-TÊTE ===
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('RAPPORT AGIL FLEET - SNDP', 65, 25);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date : ${new Date().toLocaleDateString('fr-TN')}`, 65, 40);
  doc.text(`Heure : ${new Date().toLocaleTimeString('fr-TN')}`, 65, 48);
  doc.text(`Manager : ${this.username}`, 65, 56);

  y = 70;

  // === STATISTIQUES ===
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Statistiques générales', 15, y);
  y += 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`• Véhicules                  : ${this.stats.totalVehicles}`, 20, y);
  doc.text(`• Consommation totale       : ${this.stats.totalConsumption.toFixed(0)} L`, 20, y += 10);
  doc.text(`• Coût moyen/ravitaillement : ${this.stats.averageCost.toFixed(2)} €`, 20, y += 10);
  y += 30;

  // === ALERTES ===
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Alertes détectées', 15, y);
  y += 15;

  if (this.alerts.length === 0) {
    doc.setFontSize(12);
    doc.text('Aucune anomalie détectée', 20, y);
  } else {
    doc.setFontSize(11);
    this.alerts.forEach((alert) => {
      if (y > 260) { doc.addPage(); y = 30; }
      const lines = doc.splitTextToSize(`• ${alert}`, 170);
      doc.text(lines, 20, y);
      y += lines.length * 8;
    });
  }

  // === PRÉDICTION IA ===
  if (this.pythonPrediction && !this.pythonPrediction.error) {
    if (y > 220) { doc.addPage(); y = 30; }
    (doc as any).setTextColor(220, 53, 69);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`PRÉDICTION IA - Véhicule ${this.selectedVehicleId}`, 15, y);
    y += 15;
    (doc as any).setTextColor(0);
    doc.setFontSize(12);
    doc.text(`Conso moyenne   : ${this.pythonPrediction.average_consumption_l100km} L/100km`, 20, y);
    doc.text(`Prochain plein  : ${this.pythonPrediction.next_refuel_liters} L`, 20, y += 10);
    doc.text(`Date estimée    : ${this.pythonPrediction.next_refuel_date}`, 20, y += 10);
    if (this.pythonPrediction.anomaly_detected) {
      (doc as any).setTextColor(220, 53, 69);
      doc.setFontSize(14);
      doc.text('ANOMALIE DÉTECTÉE !', 20, y += 15);
    }
  }

  // === PIED DE PAGE ===
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    (doc as any).setTextColor(100);
    doc.text('© 2025 AGIL Fleet - SNDP', 15, 290);
    doc.text(`Page ${i}/${totalPages}`, 170, 290);
  }

  // === TÉLÉCHARGEMENT IMMÉDIAT ===
  doc.save(`Rapport_Agil_Fleet_${new Date().toISOString().split('T')[0]}.pdf`);
  this.toastr.success('Rapport PDF généré avec succès !');
}
}