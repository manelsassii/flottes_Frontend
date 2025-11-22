// src/app/driver-dashboard/driver-dashboard.page.ts
import { Component, AfterViewInit, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { FuelService, FuelEntry, LocalAlert } from '../services/fuel';
import { VehicleService } from '../services/vehicle';
import { Router } from '@angular/router';
import { Chart } from 'chart.js/auto';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ChatbotComponent } from '../components/chatbot/chatbot.component';
import { ChangeDetectorRef } from '@angular/core';  // ← AJOUTEZ CETTE LIGNE

interface ConsumptionRecord {
  id: number;
  quantity: number;
  date: string;
}

@Component({
  selector: 'app-driver-dashboard',
  templateUrl: './driver-dashboard.page.html',
  styleUrls: ['./driver-dashboard.page.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule, ChatbotComponent]
})
export class DriverDashboardPage implements OnInit, AfterViewInit, OnDestroy {
  // FORMULAIRE CARBURANT
  quantity: number = 0;
  refuelDate: string = new Date().toISOString().split('T')[0];
  cost: number = 0;
  odometer: number = 0;
  isSuccess: boolean = false;
  fuelMessage: string = '';  // ← MESSAGE POUR CARBURANT

  // FORMULAIRE ANOMALIE
  anomalyMessageInput: string = '';
  anomalyType: string = 'Panne';
  anomalySuccess: boolean = false;
  anomalyMessage: string = '';  // ← MESSAGE POUR ANOMALIE

  // DONNÉES
  vehicles: any[] = [];
  selectedVehicleId: number | null = null;
  consumptionHistory: ConsumptionRecord[] = [];
  alerts: LocalAlert[] = [];

  // GRAPHIQUE
  @ViewChild('consumptionChart') consumptionChart!: ElementRef<HTMLCanvasElement>;
  private chart!: Chart;

  constructor(
    public authService: AuthService,
    private fuelService: FuelService,
    private vehicleService: VehicleService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadVehicles();
    this.loadConsumptionHistory();
    this.loadAlerts();
  }

  ngAfterViewInit() {
    this.createChart();
  }

  ngOnDestroy() {
    this.chart?.destroy();
  }

  // CHARGE VÉHICULES
  loadVehicles() {
    this.vehicleService.getAllVehicles().subscribe({
      next: (data: any[]) => {
        this.vehicles = data;
        if (data.length > 0) {
          this.selectedVehicleId = data[0].id;
        }
      },
      error: () => this.fuelMessage = 'Erreur: véhicules non chargés'
    });
  }

  // ENREGISTREMENT RAPIDE
  recordFuelConsumption(form: any) {
    if (!form.valid || this.quantity <= 0 || !this.selectedVehicleId) {
      this.fuelMessage = 'Véhicule ou quantité invalide !';
      return;
    }

    const isoDate = `${this.refuelDate}T00:00:00.000`;

    const entry: FuelEntry = {
      quantity: this.quantity,
      refuelDate: isoDate,
      cost: this.cost || undefined,
      odometerReading: this.odometer || undefined,
      vehicleId: this.selectedVehicleId
    };

    this.fuelService.saveFuel(entry).subscribe({
      next: () => {
        this.isSuccess = true;
        this.fuelMessage = 'Enregistré avec succès !';
        this.resetForm();
        this.fuelService.addAlert('Ravitaillement enregistré !');
        this.loadConsumptionHistory();
        this.loadAlerts();
      },
      error: (err) => {
        this.fuelMessage = 'Erreur : ' + (err.error?.message || 'Données invalides');
      }
    });
  }

 reportAnomaly(form: any) {
  if (!form.valid || !this.anomalyMessageInput?.trim()) {
    this.anomalyMessage = 'Description obligatoire !';
    this.cdr.detectChanges(); // ← FORCE RENDU
    return;
  }

  const payload = {
    description: this.anomalyMessageInput,
    type: this.anomalyType,
    quantity: this.quantity || 0,
    vehicleId: this.selectedVehicleId!,
    refuelDate: `${this.refuelDate}T12:00:00.000Z`
  };

  console.log('Envoi anomalie:', payload);

  this.fuelService.reportAnomaly(payload).subscribe({
    next: (res) => {
      console.log('SUCCÈS:', res);

      // FORCE LE MESSAGE + RENDU
      this.anomalySuccess = true;
      this.anomalyMessage = 'Anomalie signalée avec succès !';

      this.fuelService.addAlert(`Anomalie : ${this.anomalyMessageInput}`);

      this.anomalyMessageInput = '';
      this.anomalyType = 'Panne';
      form.resetForm();

      this.cdr.detectChanges(); // ← FORCE RENDU IMMÉDIAT

      setTimeout(() => {
        this.anomalySuccess = false;
        this.anomalyMessage = '';
        this.cdr.detectChanges(); // ← FORCE DISPARITION
      }, 3000);

      this.loadAlerts();
    },
    error: (err) => {
      console.error('ERREUR:', err);
      this.anomalyMessage = 'Erreur serveur !';
      this.cdr.detectChanges();
    }
  });
}

  // CHARGEMENT HISTORIQUE
  private loadConsumptionHistory() {
    this.fuelService.getAllFuel().subscribe({
      next: (data: FuelEntry[]) => {
        this.consumptionHistory = data
          .filter(e => e.vehicleId === this.selectedVehicleId)
          .map(e => ({
            id: e.id!,
            quantity: e.quantity,
            date: e.refuelDate.split('T')[0]
          }))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 7);
        this.updateChart();
      }
    });
  }

  // CHARGEMENT ALERTES
  private loadAlerts() {
    this.fuelService.alerts$.subscribe(alerts => {
      this.alerts = alerts.slice(0, 3);
    });
  }

  // RESET FORM
  resetForm() {
    this.quantity = 0;
    this.cost = 0;
    this.odometer = 0;
    setTimeout(() => {
      this.isSuccess = false;
      this.fuelMessage = '';
    }, 3000);
  }

  // GRAPHIQUE
  private updateChart() {
    if (!this.chart) return;
    const labels = this.consumptionHistory.map(h => h.date);
    const data = this.consumptionHistory.map(h => h.quantity);
    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = data;
    this.chart.update();
  }

  private createChart() {
    const ctx = this.consumptionChart.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Consommation (L)',
          data: [],
          borderColor: '#3498db',
          backgroundColor: 'rgba(52, 152, 219, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Litres' } },
          x: { title: { display: true, text: 'Date' } }
        }
      }
    });
  }


  

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}