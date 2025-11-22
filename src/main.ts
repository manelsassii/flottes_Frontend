// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

// AJOUTE CES IMPORTS (OBLIGATOIRE POUR NGX-CHARTS)
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

bootstrapApplication(AppComponent, {
  providers: [
    ...appConfig.providers,  // Garde tout ce que tu avais déjà

    // CES 2 LIGNES RÉSOLVENT L'ERREUR "No provider for EnvironmentInjector!"
    provideAnimations(),                    // Pour les animations (tooltips ngx-charts)
    provideCharts(withDefaultRegisterables()) // Pour ngx-charts + Chart.js
  ]
})
  .catch(err => console.error(err));