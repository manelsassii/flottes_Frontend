import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';
import { ClientService } from '../client.service';
import { Client } from '../models/client';
import { ToastrService } from 'ngx-toastr';
import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { AlertService } from '../alert.service';

interface Anomaly {
  fuelConsumptionId: number;
  vehicleId: number;
  fuelType: string;
  description: string;
  refuelDate: string;
  quantity: number;
  odometerReading: number;
}

interface SystemStatus {
  status: string;
  uptime: string;
  lastCheck: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, NgxChartsModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  username: string = '';
  totalClients: number = 0;
  totalVehicles: number = 0;
  recentClients: Client[] = [];
  errorMessage: string | null = null;
  vehiclesByFuelTypeData: any[] = [];
  consumptionStatsData: any[] = [];
  colorScheme: Color = {
    name: 'custom',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']
  };
  fuelType: string = 'Essence';
  distanceKm: number = 100;
  predictedConsumption: number | null = null;
  anomalies: Anomaly[] = [];
  totalConsumption: number = 0;
  systemStatus: string | null = null;
  systemLogs: string[] = [];
  selectedVehicleId: number = 1;
pythonPrediction: any = null;
isLoadingPython = false;

  constructor(
    private authService: AuthService,
    private clientService: ClientService,
    private http: HttpClient,
    private router: Router,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
    private alertService: AlertService
  ) {}

  // Initialisation
  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.username = this.authService.getUsername() || 'Utilisateur';
    this.loadDashboardData();
    this.loadStatistics();
    this.checkSystemStatus();
    this.subscribeToAlerts();
  }

  // Gestion des données
  private loadDashboardData(): void {
    this.clientService.getAllClients().subscribe({
      next: (clients: Client[]) => {
        this.totalClients = clients.length;
        this.recentClients = clients.slice(0, 5);
        this.errorMessage = null;
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.handleError(err, 'Erreur lors du chargement des clients');
      }
    });

    this.http.get<any[]>('http://localhost:8081/api/admin/vehicles/stats').subscribe({
      next: (vehicles) => {
        this.totalVehicles = vehicles.length;
        this.errorMessage = null;
        this.updateVehiclesByFuelType(vehicles);
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.handleError(err, 'Erreur lors du chargement des véhicules');
      }
    });
  }

  private updateVehiclesByFuelType(vehicles: any[]): void {
    const counts = { Essence: 0, Diesel: 0, Électrique: 0, Hybride: 0 };
    vehicles.forEach((vehicle: any) => {
      if (vehicle.fuelType && vehicle.fuelType in counts) {
        counts[vehicle.fuelType as keyof typeof counts]++;
      }
    });
    this.vehiclesByFuelTypeData = [
      { name: 'Essence', value: counts.Essence },
      { name: 'Diesel', value: counts.Diesel },
      { name: 'Électrique', value: counts.Électrique },
      { name: 'Hybride', value: counts.Hybride }
    ];
  }

  // Prédictions
  predictConsumption(): void {
    this.http.get<number>(`http://localhost:8081/api/fuel-consumptions/predict?fuelType=${this.fuelType}&distanceKm=${this.distanceKm}`).subscribe({
      next: (result) => {
        this.predictedConsumption = result;
        const unit = this.fuelType === 'Électrique' ? 'kWh' : 'litres';
        this.toastr.success(`Prédiction : ${result.toFixed(2)} ${unit} pour ${this.distanceKm} km`);
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.handleError(err, 'Erreur lors de la prédiction');
      }
    });
  }

  // Export PDF
  async exportPDF(): Promise<void> {
    try {
      if (this.totalClients === 0 || this.totalVehicles === 0) {
        this.toastr.error('Veuillez attendre le chargement des données');
        return;
      }
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('Tableau de bord Admin - Agil Fleet', 10, 10);
      doc.setFontSize(12);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 10, 20);
      doc.text(`Utilisateur: ${this.username}`, 10, 30);
      doc.text(`Total Clients: ${this.totalClients}`, 10, 40);
      doc.text(`Total Véhicules: ${this.totalVehicles}`, 10, 50);
      doc.text(`Consommation Totale: ${this.totalConsumption} litres`, 10, 60);

      let y = 70;
      doc.text('Clients récents:', 10, y);
      y += 10;
      this.recentClients.forEach((client, index) => {
        if (index < 5) {
          doc.text(`${client.companyName} (${client.contactEmail})`, 10, y);
          y += 10;
        }
      });

      doc.text('Statistiques des véhicules par type:', 10, y);
      y += 10;
      this.vehiclesByFuelTypeData.forEach(data => {
        doc.text(`${data.name}: ${data.value}`, 10, y);
        y += 10;
      });

      if (this.predictedConsumption !== null) {
        const unit = this.fuelType === 'Électrique' ? 'kWh' : 'litres';
        doc.text(`Prédiction: ${this.predictedConsumption.toFixed(2)} ${unit} pour ${this.distanceKm} km (${this.fuelType})`, 10, y);
        y += 10;
      }

      if (this.anomalies.length > 0) {
        doc.text('Anomalies détectées:', 10, y);
        y += 10;
        this.anomalies.forEach((anomaly, index) => {
          if (index < 5) {
            doc.text(`[${anomaly.refuelDate}] Véhicule ${anomaly.vehicleId} (${anomaly.fuelType}): ${anomaly.description}`, 10, y);
            y += 10;
          }
        });
      }

      const chartElement = document.getElementById('fuel-chart') as HTMLElement;
      if (chartElement) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const canvas = await html2canvas(chartElement);
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 180;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        doc.addImage(imgData, 'PNG', 10, y, imgWidth, imgHeight);
        y += imgHeight + 10;
      }

      doc.save('dashboard-admin-agil-fleet.pdf');
    } catch (error) {
      console.error('Erreur lors de l\'exportation PDF:', error);
      this.toastr.error('Erreur lors de la génération du PDF');
    }
  }

  // Authentification
  logout(): void {
    this.authService.logout();
    this.toastr.success('Déconnexion réussie');
    this.router.navigate(['/login']);
  }

  isRouteActive(route: string): boolean {
    return this.router.url === route;
  }

  // Statistiques
  loadStatistics(): void {
    this.totalConsumption = 1000; // Valeur simulée
    this.cdr.detectChanges();
  }

  // Système
  checkSystemStatus(): void {
    this.http.get<SystemStatus>('http://localhost:8081/api/system/status').subscribe({
      next: (status) => {
        this.systemStatus = status.status;
        if (status.status === 'DOWN') this.toastr.error('Système en panne, intervention requise !');
        else this.toastr.info(`Statut système : ${status.status}`);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.handleError(err, 'Erreur lors de la vérification du statut');
      }
    });
  }

  resolveAnomalies(): void {
    this.alertService.markResolved();
    this.toastr.success('Anomalies résolues avec succès (simulation)');
    this.anomalies = [];
    this.cdr.detectChanges();
  }

  restartSystem(): void {
    this.http.post('http://localhost:8081/api/system/restart', {}).subscribe({
      next: () => {
        this.toastr.success('Système redémarré');
        this.checkSystemStatus();
      },
      error: (err) => {
        this.handleError(err, 'Erreur lors du redémarrage');
      }
    });
  }

  loadSystemLogs(): void {
    this.http.get<string[]>('http://localhost:8081/api/admin/system/logs').subscribe({
      next: (logs) => {
        this.systemLogs = logs;
        this.toastr.success('Logs système chargés');
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.handleError(err, 'Erreur lors du chargement des logs');
      }
    });
  }

  // Alertes
  private subscribeToAlerts(): void {
    this.alertService.alerts$.subscribe(alerts => {
      console.log('Alertes reçues par admin:', alerts);
      this.anomalies = alerts.map(alert => {
        const [description] = alert.split(':');
        const [_, vehiclePart, quantityPart] = alert.split(' ');
        const vehicleId = parseInt(vehiclePart.match(/\d+/)?.[0] || '0', 10);
        const quantityStr = quantityPart.replace(/[kWh|litres]/g, '').trim();
        const quantity = parseFloat(quantityStr) || 0;
        const fuelType = quantityPart.includes('kWh') ? 'Électrique' : 'Inconnu';
        return {
          fuelConsumptionId: 0,
          vehicleId: vehicleId,
          fuelType: fuelType,
          description: description.trim(),
          refuelDate: new Date().toISOString().split('T')[0],
          quantity: quantity,
          odometerReading: 0
        };
      });
      if (this.anomalies.length > 0) {
        this.toastr.warning(`${this.anomalies.length} anomalie(s) détectée(s) par le manager`);
      } else {
        this.toastr.info('Aucune anomalie détectée.');
      }
      this.cdr.detectChanges();
    });
  }
  launchPythonPrediction() {
  if (!this.selectedVehicleId || this.selectedVehicleId <= 0) {
    this.toastr.error('Veuillez entrer un ID de véhicule valide');
    return;
  }

  this.isLoadingPython = true;
  this.pythonPrediction = null;

  this.http.get<any>(`http://localhost:8081/api/fuel-consumptions/python-predict/${this.selectedVehicleId}`)
    .subscribe({
      next: (result) => {
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
      error: (err) => {
        this.isLoadingPython = false;
        this.pythonPrediction = { error: "Impossible de contacter l'IA Python (vérifiez le backend)" };
        this.toastr.error('Erreur de connexion à l\'IA');
        console.error(err);
      }
    });
}

  // Gestion des erreurs
  private handleError(err: HttpErrorResponse, defaultMessage: string): void {
    this.errorMessage = err.message || defaultMessage;
    if (err.status === 403) {
      this.toastr.error('Accès interdit : vous n\'avez pas les permissions nécessaires.');
    } else {
      this.toastr.error(this.errorMessage ?? 'Erreur inconnue');
    }
    console.error('Erreur:', err);
    this.cdr.detectChanges();
  }
}