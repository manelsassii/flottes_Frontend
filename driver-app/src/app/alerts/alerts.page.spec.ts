import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router, RouterLink } from '@angular/router'; // AJOUTÉ
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-alerts',
  templateUrl: './alerts.page.html',
  styleUrls: ['./alerts.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
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
    this.http.get<any[]>('/api/fuel-consumptions/anomalies').subscribe(
      (data) => {
        this.alerts = data
          .filter(a => a && a.description)
          .map(a => ({
            message: a.description,
            date: a.refuelDate ? a.refuelDate.split('T')[0] : new Date().toISOString().split('T')[0],
            read: false
          }));
      }
    );
  }
}