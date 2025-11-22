// src/app/alerts/alerts.page.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FuelService, LocalAlert } from '../services/fuel';

@Component({
  selector: 'app-alerts',
  templateUrl: './alerts.page.html',
  styleUrls: ['./alerts.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AlertsPage implements OnInit, OnDestroy {
  alerts: LocalAlert[] = [];
  unreadCount = 0;
  private sub: any;

  constructor(
    public authService: AuthService,
    private router: Router,
    private fuelService: FuelService
  ) {}

  ngOnInit() {
    this.sub = this.fuelService.alerts$.subscribe(alerts => {
      this.alerts = alerts;
      this.unreadCount = alerts.filter(a => !a.read).length;
    });
  }

  markAsRead(index: number) {
    this.fuelService.markAsRead(index);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}