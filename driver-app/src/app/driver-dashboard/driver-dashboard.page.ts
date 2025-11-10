// src/app/driver-dashboard/driver-dashboard.page.ts
import { Component, AfterViewInit, ViewChild, ElementRef, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Chart } from 'chart.js/auto';

interface FuelConsumptionDTO {
  id: number;
  quantity: number;
  cost?: number;
  refuelDate: string;
  odometerReading?: number;
  vehicleId?: number;
  fuelType?: string;
}

interface ConsumptionRecord {
  id: number;
  quantity: number;
  date: string;
}

interface Anomaly {
  fuelConsumptionId: number;
  vehicleId: number;
  fuelType: string;
  description: string;
  refuelDate?: string;
  quantity: number;
  odometerReading: number;
  username?: string;
}

@Component({
  selector: 'app-driver-dashboard',
  templateUrl: './driver-dashboard.page.html',
  styleUrls: ['./driver-dashboard.page.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]  // ← ÇA CORRIGE ion-content, ion-header, etc.

})
export class DriverDashboardPage implements AfterViewInit, OnInit {
  fuelQuantity: number = 0;
  fuelDate: string = new Date().toISOString().substring(0, 10);
  isSuccess: boolean = false;
  anomalyMessage: string = '';
  anomalyType: string = 'Panne';
  anomalySuccess: boolean = false;
  alerts: { message: string, date: string, read: boolean }[] = [];
  consumptionHistory: ConsumptionRecord[] = [];

  // Données du graphique
  consumptionData = [
    { day: '24/09', value: 6 },
    { day: '25/09', value: 7 },
    { day: '26/09', value: 8 },
    { day: '27/09', value: 9 },
    { day: '28/09', value: 10 },
    { day: '29/09', value: 8 },
    { day: '30/09', value: 7 }
  ];

  @ViewChild('consumptionChart') consumptionChart!: ElementRef<HTMLCanvasElement>;
  private chart: Chart | undefined;

  private vehicleId: number = 1;

  constructor(
    public authService: AuthService,
    public router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadConsumptionHistory();
    this.loadAnomalies();
  }

  ngAfterViewInit() {
    this.createChart();
  }

  

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  recordFuelConsumption(form: any) {
    if (form.valid && this.fuelQuantity > 0) {
      const data = {
        quantity: this.fuelQuantity,
        refuelDate: this.fuelDate + 'T12:00:00',
        vehicle: { id: this.vehicleId }
      };
      this.http.post<FuelConsumptionDTO>('/api/fuel-consumptions/register', data).subscribe(
        (response) => {
          this.consumptionHistory.unshift({
            id: response.id,
            quantity: response.quantity,
            date: response.refuelDate.split('T')[0]
          });
          this.isSuccess = true;
          setTimeout(() => this.isSuccess = false, 3000);
          this.fuelQuantity = 0;
          form.resetForm();
          this.loadAnomalies();
        },
        (error) => {
          console.error('Erreur enregistrement:', error);
          alert('Erreur : ' + (error.error?.message || error.message));
        }
      );
    } else {
      alert('Veuillez entrer une quantité valide supérieure à 0 !');
    }
  }

  reportAnomaly(form: any) {
    if (form.valid && this.anomalyMessage) {
      const data = {
        description: this.anomalyMessage,
        type: this.anomalyType,
        quantity: this.fuelQuantity,
        vehicleId: this.vehicleId,
        refuelDate: this.fuelDate + 'T12:00:00'
      };
      this.http.post('/api/anomalies/report', data).subscribe(
        () => {
          this.anomalySuccess = true;
          setTimeout(() => this.anomalySuccess = false, 3000);
          this.anomalyMessage = '';
          this.anomalyType = 'Panne';
          form.resetForm();
          this.loadAnomalies();
        },
        (error) => {
          console.error('Erreur signalement:', error);
          alert('Erreur : ' + (error.error?.message || error.message));
        }
      );
    } else {
      alert('Veuillez décrire l\'anomalie !');
    }
  }

  markAlertAsRead(alert: { message: string, date: string, read: boolean }) {
    alert.read = true;
  }

  deleteRecord(record: ConsumptionRecord) {
    this.http.delete(`/api/fuel-consumptions/${record.id}`).subscribe(
      () => {
        const index = this.consumptionHistory.findIndex(r => r.id === record.id);
        if (index !== -1) {
          this.consumptionHistory.splice(index, 1);
        }
      },
      (error) => {
        console.error('Erreur suppression:', error);
        alert('Erreur : ' + (error.error?.message || error.message));
      }
    );
  }

  private loadConsumptionHistory() {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    this.http.get<FuelConsumptionDTO[]>(
      `/api/fuel-consumptions?vehicleId=${this.vehicleId}&startDate=${startDate.toISOString()}&endDate=${new Date().toISOString()}`
    ).subscribe(
      (data) => {
        this.consumptionHistory = data.map(item => ({
          id: item.id,
          quantity: item.quantity,
          date: item.refuelDate.split('T')[0]
        }));
      },
      (error) => {
        console.error('Erreur chargement historique:', error);
      }
    );
  }

  private loadAnomalies() {
    this.http.get<Anomaly[]>('/api/fuel-consumptions/anomalies').subscribe(
      (data) => {
        this.alerts = data
          .filter(item => item && item.description)
          .map(item => ({
            message: item.description,
            date: item.refuelDate ? item.refuelDate.split('T')[0] : new Date().toISOString().split('T')[0],
            read: false
          }));
      },
      (error) => {
        console.error('Erreur anomalies:', error);
      }
    );
  }

  private createChart() {
    if (this.consumptionChart) {
      const ctx = this.consumptionChart.nativeElement.getContext('2d');
      if (ctx) {
        this.chart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: this.consumptionData.map(item => item.day),
            datasets: [{
              label: 'Consommation (L)',
              data: this.consumptionData.map(item => item.value),
              borderColor: '#3498db',
              backgroundColor: 'rgba(52, 152, 219, 0.2)',
              borderWidth: 2,
              fill: true,
              tension: 0.4,
              pointRadius: 4,
              pointHoverRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { beginAtZero: true, title: { display: true, text: 'Litres' } },
              x: { title: { display: true, text: 'Jours' } }
            },
            plugins: { legend: { position: 'bottom' } }
          }
        });
      }
    }
  }
}