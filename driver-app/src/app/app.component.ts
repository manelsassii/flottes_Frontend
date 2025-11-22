// src/app/app.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { 
  IonApp, IonRouterOutlet, IonMenu, IonContent, IonHeader, IonToolbar,
  IonList, IonItem, IonIcon, IonLabel, IonTitle, IonBadge
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  speedometerOutline, barChartOutline, alertCircleOutline, 
  timeOutline, flameOutline, listOutline 
} from 'ionicons/icons';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FuelService } from './services/fuel';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [
    IonApp, IonRouterOutlet, IonMenu, IonContent, IonHeader, IonToolbar,
    IonList, IonItem, IonIcon, IonLabel, IonTitle, IonBadge, RouterLink,
    CommonModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppComponent implements OnInit, OnDestroy {
  unreadCount = 0;
  private sub: any;

  constructor(private fuelService: FuelService) {
    addIcons({
      'speedometer-outline': speedometerOutline,
      'bar-chart-outline': barChartOutline,
      'alert-circle-outline': alertCircleOutline,
      'time-outline': timeOutline,
      'flame-outline': flameOutline,
      'list-outline': listOutline
    });
  }

  ngOnInit() {
    this.sub = this.fuelService.alerts$.subscribe(alerts => {
      this.unreadCount = alerts.filter(a => !a.read).length;
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  closeMenu() {
    const menu = document.querySelector('ion-menu');
    if (menu) menu.close();
  }
}