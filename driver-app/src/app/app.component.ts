// src/app/app.component.ts
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { 
  IonApp, IonRouterOutlet, IonMenu, IonContent, IonHeader, IonToolbar,
  IonList, IonItem, IonIcon, IonLabel, IonTitle
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  speedometerOutline, barChartOutline, alertCircleOutline, 
  timeOutline, flameOutline, listOutline 
} from 'ionicons/icons';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [
    IonApp, IonRouterOutlet, IonMenu, IonContent, IonHeader, IonToolbar,
    IonList, IonItem, IonIcon, IonLabel, IonTitle,
    RouterLink
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppComponent {
  constructor() {
    addIcons({
      'speedometer-outline': speedometerOutline,
      'bar-chart-outline': barChartOutline,
      'alert-circle-outline': alertCircleOutline,
      'time-outline': timeOutline,
      'flame-outline': flameOutline,
      'list-outline': listOutline
    });
  }

  closeMenu() {
    const menu = document.querySelector('ion-menu');
    if (menu) menu.close();
  }
}