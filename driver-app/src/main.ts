import { enableProdMode, importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { provideHttpClient } from '@angular/common/http';
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import { addIcons } from 'ionicons';
import { flame, checkmarkCircle, logOut, save, warning, trash, alertCircle } from 'ionicons/icons';

if (enableProdMode) {
  enableProdMode();
}

// Enregistrer les icônes nécessaires
addIcons({
  'flame': flame,
  'checkmark-circle': checkmarkCircle,
  'log-out': logOut,
  'save': save,
  'warning': warning,
  'trash': trash,
  'alert-circle': alertCircle
});

// Définir les éléments PWA après le bootstrap
const bootstrapAndDefine = () => {
  bootstrapApplication(AppComponent, {
    providers: [
      { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
      provideRouter(routes),
      provideHttpClient(),
      importProvidersFrom(IonicModule.forRoot({}))
    ],
  }).then(() => {
    defineCustomElements(window); // Initialise les éléments PWA après le bootstrap
  });
};

bootstrapAndDefine();