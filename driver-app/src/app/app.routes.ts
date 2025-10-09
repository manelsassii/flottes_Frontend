import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then(m => m.LoginPage),
  },
  {
    path: 'driver-dashboard',
    loadComponent: () => import('./driver-dashboard/driver-dashboard.page').then(m => m.DriverDashboardPage),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.page').then(m => m.DashboardPage),
  },
  {
    path: 'driver-dashboard',
    loadComponent: () => import('./driver-dashboard/driver-dashboard.page').then( m => m.DriverDashboardPage)
  },
];