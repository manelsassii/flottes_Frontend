// src/app/app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./login/login.page').then(m => m.LoginPage) },
  { path: 'driver-dashboard', loadComponent: () => import('./driver-dashboard/driver-dashboard.page').then(m => m.DriverDashboardPage) },
  { path: 'stats', loadComponent: () => import('./stats/stats.page').then(m => m.StatsPage) },
  { path: 'alerts', loadComponent: () => import('./alerts/alerts.page').then(m => m.AlertsPage) },
  { path: 'history', loadComponent: () => import('./history/history.page').then(m => m.HistoryPage) },
  { path: 'fuel-log', loadComponent: () => import('./fuel-log/fuel-log.component').then(m => m.FuelLogComponent) },
  { path: 'fuel-list', loadComponent: () => import('./fuel-list/fuel-list.component').then(m => m.FuelListComponent) },
  { path: '**', redirectTo: '/login' }
];