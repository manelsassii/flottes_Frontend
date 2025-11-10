// src/main.ts
import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router'; // AJOUTÉ withComponentInputBinding
import { provideHttpClient } from '@angular/common/http';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import { addIcons } from 'ionicons';
import { 
  speedometerOutline, barChartOutline, alertCircleOutline, 
  timeOutline, flameOutline, listOutline 
} from 'ionicons/icons';
import 'zone.js'; // AJOUTÉ

if (location.hostname !== 'localhost') {
  enableProdMode();
}

addIcons({
  'speedometer-outline': speedometerOutline,
  'bar-chart-outline': barChartOutline,
  'alert-circle-outline': alertCircleOutline,
  'time-outline': timeOutline,
  'flame-outline': flameOutline,
  'list-outline': listOutline
});

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes, withComponentInputBinding()), // AJOUTÉ
    provideHttpClient(),
    provideIonicAngular()
  ]
}).then(() => {
  defineCustomElements();
}).catch(err => console.error(err));