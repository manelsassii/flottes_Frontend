// stats.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router'; // Importé pour la déconnexion
import { AuthService } from '../auth.service'; // Importé pour gérer la déconnexion

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, NgxChartsModule],
  template: `
    <!-- Navbar -->
    <nav class="navbar navbar-expand navbar-dark bg-dark">
      <div class="container-fluid">
        <a class="navbar-brand" href="#">Statistiques - Agil Fleet</a>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav ms-auto">
            <li class="nav-item">
              <a class="nav-link" routerLink="/admin/dashboard">Tableau de bord</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/admin/clients">Gestion Clients</a>
            </li>
            <li class="nav-item">
              <a class="nav-link active" routerLink="/admin/stats">Statistiques Globales</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#" (click)="logout()">Déconnexion ({{ username }})</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <!-- Contenu principal -->
    <div class="container-fluid pt-4"> <!-- Padding-top pour éviter le chevauchement avec le navbar -->
      <h2 class="mb-4">Statistiques Globales</h2>
      <div *ngIf="loading" class="text-center">Chargement...</div>
      <div *ngIf="error" class="alert alert-danger">{{ error }}</div>
      <div *ngIf="stats && !loading && chartData && !loading" class="row">
        <!-- Statistiques globales -->
        <div class="col-md-6 mb-4">
          <div class="card shadow">
            <div class="card-header">
              <h6 class="m-0 font-weight-bold text-primary">Statistiques globales</h6>
            </div>
            <div class="card-body">
              <p>Total consommation : {{ stats.totalConsumption || 0 }} litres</p>
            </div>
          </div>
        </div>
        <!-- Consommation moyenne par véhicule -->
        <div class="col-md-6 mb-4">
          <div class="card shadow">
            <div class="card-header">
              <h6 class="m-0 font-weight-bold text-primary">Consommation moyenne par véhicule</h6>
            </div>
            <div class="card-body">
              <ngx-charts-bar-vertical
                *ngIf="chartData.length > 0"
                [results]="chartData"
                [xAxis]="true"
                [yAxis]="true"
                [xAxisLabel]="'Véhicule ID'"
                [yAxisLabel]="'Consommation moyenne (L/100km)'"
                [scheme]="colorScheme">
              </ngx-charts-bar-vertical>
              <p *ngIf="chartData.length === 0" class="text-warning">Aucune donnée disponible</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .card { height: 100%; }
    .pt-4 { padding-top: 1.5rem; } /* Ajustement pour éviter le chevauchement */
  `]
})
export class StatsComponent implements OnInit {
  stats: any;
  chartData: any[] = [];
  loading = true;
  error: string | null = null;
  colorScheme: Color = {
    name: 'customScheme',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#5AA454', '#A10A28', '#C7B42C', '#AAAAAA']
  };
  username: string = ''; // Ajouté pour afficher le nom dans le navbar

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService,
    private router: Router,
    private authService: AuthService // Injecté pour la déconnexion
  ) {}

  ngOnInit() {
    this.username = this.authService.getUsername() || 'Utilisateur'; // Récupère le nom d'utilisateur
    this.loadStats();
  }

  loadStats() {
    this.http.get<any>('http://localhost:8081/api/stats/vehicles/consumption').subscribe({
      next: (data) => {
        this.chartData = data.map((item: any) => ({
          name: item.vehicleId ? item.vehicleId.toString() : 'Inconnu',
          value: item.avgConsumption || 0
        }));
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des statistiques par véhicule';
        this.loading = false;
        this.toastr.error(this.error);
        console.error('Erreur stats par véhicule:', err);
        this.cdr.detectChanges();
      }
    });

    this.http.get<any>('http://localhost:8081/api/stats/global').subscribe({
      next: (globalData) => {
        this.stats = globalData;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des statistiques globales';
        this.loading = false;
        this.toastr.error(this.error);
        console.error('Erreur stats globales:', err);
        this.cdr.detectChanges();
      }
    });
  }

  logout() {
    this.authService.logout();
    this.toastr.success('Déconnexion réussie');
    this.router.navigate(['/login']);
  }
}