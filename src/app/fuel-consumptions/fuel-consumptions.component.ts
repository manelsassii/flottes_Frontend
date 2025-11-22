import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { FuelConsumption, Vehicle } from '../models/fuel-consumption';
import { AuthService } from '../auth.service'; // Ajout pour vérifier le rôle

@Component({
  selector: 'app-fuel-consumptions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './fuel-consumptions.component.html',
  styleUrls: ['./fuel-consumptions.component.css']
})
export class FuelConsumptionsComponent implements OnInit {
  fuelConsumptions: FuelConsumption[] = [];
  vehicles: Vehicle[] = [];
  errorMessage: string | null = null;
  filters = {
    vehicleId: '',
    fuelType: '',
    startDate: '',
    endDate: ''
  };
  newFuelConsumption: FuelConsumption = { id: 0, quantity: 0, cost: 0, refuelDate: '', odometerReading: 0, vehicleId: 0, fuelType: '', vehicle: { id: 0 } };
  isEditing: boolean = false;
  editingId: number | null = null;
  predictedConsumption: number | null = null;
  distanceKm: number = 0;
  selectedVehicleId: number = 1;
pythonPrediction: any = null;
isLoadingPython = false;

  constructor(
    private http: HttpClient,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private authService: AuthService // Injecté pour vérifier le rôle
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    const role = this.authService.getUserRole();
    console.log('Rôle utilisateur:', role);
    if (role !== 'MANAGER') {
      this.toastr.error('Accès interdit : vous devez être manager.');
      this.router.navigate(['/login']);
      return;
    }
    this.loadVehicles();
    this.loadFuelConsumptions();
  }

  loadVehicles(): void {
    console.log('loadVehicles - Début du chargement');
    this.http.get<Vehicle[]>('http://localhost:8081/api/vehicles').subscribe({
      next: (data) => {
        this.vehicles = data;
        console.log('loadVehicles - Succès:', data.length, 'véhicules chargés');
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        console.warn('loadVehicles - Échec (403 ou autre) :', err.message);
        this.vehicles = []; // Continuer avec une liste vide si échec
        this.cdr.detectChanges();
      }
    });
  }

  loadFuelConsumptions(): void {
    let url = 'http://localhost:8081/api/fuel-consumptions';
    const params: any = {};

    if (this.filters.vehicleId) params.vehicleId = this.filters.vehicleId;
    if (this.filters.fuelType) params.fuelType = this.filters.fuelType;
    if (this.filters.startDate) params.startDate = this.formatDate(this.filters.startDate);
    if (this.filters.endDate) params.endDate = this.formatDate(this.filters.endDate);

    this.http.get<FuelConsumption[]>(url, { params }).subscribe({
      next: (data) => {
        this.fuelConsumptions = data;
        this.errorMessage = null;
        console.log('loadFuelConsumptions - Succès:', data.length, 'ravitaillements chargés');
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = err.message || 'Erreur lors du chargement des ravitaillements';
        if (this.errorMessage) this.toastr.error(this.errorMessage);
        console.error('Erreur loadFuelConsumptions:', err);
        this.cdr.detectChanges();
      }
    });
  }

  applyFilters(): void {
    this.loadFuelConsumptions();
  }

  deleteFuelConsumption(id: number | undefined): void {
    if (!id || !confirm('Êtes-vous sûr de vouloir supprimer ce ravitaillement ?')) return;
    this.http.delete(`http://localhost:8081/api/fuel-consumptions/${id}`).subscribe({
      next: () => {
        this.toastr.success('Ravitaillement supprimé avec succès');
        this.loadFuelConsumptions();
      },
      error: (err: HttpErrorResponse) => {
        this.toastr.error('Erreur lors de la suppression');
        console.error('Erreur:', err);
      }
    });
  }

  addFuelConsumption(): void {
    if (!this.newFuelConsumption.vehicleId || this.newFuelConsumption.quantity == null || this.newFuelConsumption.quantity < 0) {
      this.toastr.error('Veuillez sélectionner un véhicule et entrer une quantité valide');
      return;
    }
    const body = {
      quantity: this.newFuelConsumption.quantity,
      cost: this.newFuelConsumption.cost || 0,
      refuelDate: this.newFuelConsumption.refuelDate ? this.formatDate(this.newFuelConsumption.refuelDate) : new Date().toISOString(),
      odometerReading: this.newFuelConsumption.odometerReading || 0,
      vehicle: { id: this.newFuelConsumption.vehicleId }
    };
    console.log('Body envoyé pour ajout:', body);
    this.http.post<FuelConsumption>('http://localhost:8081/api/fuel-consumptions', body).subscribe({
      next: (data) => {
        this.toastr.success('Ravitaillement ajouté avec succès');
        this.resetForm();
        this.loadFuelConsumptions();
      },
      error: (err: HttpErrorResponse) => {
        this.toastr.error('Erreur lors de l\'ajout : ' + (err.error || err.message));
        console.error('Erreur:', err);
      }
    });
  }

  editFuelConsumption(id: number | undefined): void {
    if (!id) return;
    const fc = this.fuelConsumptions.find(f => f.id === id);
    if (fc) {
      this.newFuelConsumption = { ...fc, vehicle: { id: fc.vehicleId || 0 } };
      this.isEditing = true;
      this.editingId = id;
    }
  }

  updateFuelConsumption(): void {
    if (!this.editingId || !this.newFuelConsumption.vehicleId || this.newFuelConsumption.quantity == null || this.newFuelConsumption.quantity < 0) {
      this.toastr.error('Veuillez remplir tous les champs valides');
      return;
    }
    const body = {
      quantity: this.newFuelConsumption.quantity,
      cost: this.newFuelConsumption.cost || 0,
      refuelDate: this.newFuelConsumption.refuelDate ? this.formatDate(this.newFuelConsumption.refuelDate) : new Date().toISOString(),
      odometerReading: this.newFuelConsumption.odometerReading || 0,
      vehicle: { id: this.newFuelConsumption.vehicleId }
    };
    console.log('Body envoyé pour mise à jour:', JSON.stringify(body, null, 2));
    this.http.put<FuelConsumption>(`http://localhost:8081/api/fuel-consumptions/${this.editingId}`, body).subscribe({
      next: (data) => {
        this.toastr.success('Ravitaillement modifié avec succès');
        this.resetForm();
        this.loadFuelConsumptions();
      },
      error: (err: HttpErrorResponse) => {
        this.toastr.error('Erreur lors de la modification : ' + (err.error || err.message));
        console.error('Erreur:', err);
      }
    });
  }

  resetForm(): void {
    this.newFuelConsumption = { id: 0, quantity: 0, cost: 0, refuelDate: '', odometerReading: 0, vehicleId: 0, fuelType: '', vehicle: { id: 0 } };
    this.isEditing = false;
    this.editingId = null;
  }

  private formatDate(dateStr: string | undefined): string {
    if (!dateStr) return new Date().toISOString();
    const date = new Date(dateStr);
    return date.toISOString();
  }

  predictConsumption(): void {
    if (!this.newFuelConsumption.fuelType || this.distanceKm <= 0) {
      this.toastr.error('Veuillez sélectionner un type de carburant et entrer une distance valide.');
      return;
    }
    this.http.get<number>(`http://localhost:8081/api/fuel-consumptions/predict?fuelType=${this.newFuelConsumption.fuelType}&distanceKm=${this.distanceKm}`).subscribe({
      next: (data) => {
        this.predictedConsumption = data;
        this.toastr.success('Prédiction réussie ! Consommation estimée : ' + data + ' ' + (this.newFuelConsumption.fuelType === 'Électrique' ? 'kWh' : 'litres'));
      },
      error: (err: HttpErrorResponse) => {
        this.toastr.error(`Erreur lors de la prédiction : ${err.status} - ${err.statusText}. Détails : ${err.error || err.message}`);
        console.error('Erreur predictConsumption:', err);
      }
    });
  }

  launchPythonPrediction() {
  if (!this.selectedVehicleId || this.selectedVehicleId <= 0) {
    this.toastr.error('Veuillez entrer un ID de véhicule valide');
    return;
  }

  this.isLoadingPython = true;
  this.pythonPrediction = null;

  this.http.get<any>(`http://localhost:8081/api/fuel-consumptions/python-predict/${this.selectedVehicleId}`)
    .subscribe({
      next: (result) => {
        this.pythonPrediction = result;
        this.isLoadingPython = false;

        if (result.error) {
          this.toastr.error('IA Python : ' + result.error);
        } else if (result.anomaly_detected) {
          this.toastr.warning('Anomalie détectée sur le véhicule ' + this.selectedVehicleId);
        } else {
          this.toastr.success('Prédiction IA réussie pour le véhicule ' + this.selectedVehicleId);
        }
      },
      error: (err) => {
        this.isLoadingPython = false;
        this.pythonPrediction = { error: "Impossible de contacter l'IA Python (vérifiez le backend)" };
        this.toastr.error('Erreur de connexion à l\'IA');
        console.error(err);
      }
    });
}

   // Navigation et déconnexion
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}