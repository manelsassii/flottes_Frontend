import { Routes } from '@angular/router';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ClientManagementComponent } from './client-management/client-management.component';
import { VehicleManagementComponent } from './vehicle-management/vehicle-management.component';
import { FuelConsumptionsComponent } from './fuel-consumptions/fuel-consumptions.component';
import { AuthGuard } from './auth.guard';
import { ManagerDashboardComponent } from './manager-dashboard/manager-dashboard.component';
import { StatsComponent } from './stats/stats.component';
import { DriverManagementComponent } from './driver-management/driver-management.component';


export const routes: Routes = [
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  
  {
    path: 'admin',
    canActivate: [AuthGuard], // Remplace AdminGuard par AuthGuard
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'clients', component: ClientManagementComponent },
      { path: 'stats', component: StatsComponent }
    ]
  },
  {
    path: 'manager',
    canActivate: [AuthGuard], // Remplace ManagerGuard par AuthGuard
    children: [
      { path: 'dashboard', component: ManagerDashboardComponent },
      { path: 'vehicles', component: VehicleManagementComponent },
      { path: 'fuel-consumptions', component: FuelConsumptionsComponent },
      { path: 'drivers', component: DriverManagementComponent }
    ]
  },
  
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];