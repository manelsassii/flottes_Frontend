// src/app/alerts/alerts.page.ts
import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface Anomaly {
  description: string;
  refuelDate?: string;
}

@Component({
  selector: 'app-alerts',
  templateUrl: './alerts.page.html',
  styleUrls: ['./alerts.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]  // ← ÇA CORRIGE ion-content, ion-header, etc.

})
export class AlertsPage implements OnInit {
  alerts: { message: string, date: string, read: boolean }[] = [];

  constructor(
    public authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadAlerts();
  }

 

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  markAlertAsRead(alert: any) {
    alert.read = true;
  }

  private loadAlerts() {
    this.http.get<Anomaly[]>('/api/fuel-consumptions/anomalies').subscribe(
      (data) => {
        this.alerts = data
          .filter(a => a && a.description)
          .map(a => ({
            message: a.description,
            date: a.refuelDate ? a.refuelDate.split('T')[0] : new Date().toISOString().split('T')[0],
            read: false
          }));
      },
      (error) => {
        console.error('Erreur chargement alertes:', error);
      }
    );
  }
}