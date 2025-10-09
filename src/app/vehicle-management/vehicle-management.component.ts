import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { VehicleService } from '../vehicle.service';
import { ClientService } from '../client.service';
import { Vehicle } from '../models/vehicle';
import { Client } from '../models/client';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

// Interface temporaire pour le payload envoyé au backend
interface VehiclePayload {
  id?: number;
  licensePlate: string;
  brand: string;
  model: string;
  fuelType: string;
  year: number;
  client: { id: number };
}

@Component({
  selector: 'app-vehicle-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehicle-management.component.html',
  styleUrls: ['./vehicle-management.component.css']
})
export class VehicleManagementComponent implements OnInit {
  vehicles: Vehicle[] = [];
  filteredVehicles: Vehicle[] = [];
  clients: Client[] = [];
  selectedVehicle: Vehicle = {
    licensePlate: '',
    brand: '',
    model: '',
    fuelType: '',
    year: 0,
    client: undefined
  };
  selectedClientId: number | undefined = undefined;
  isEditing: boolean = false;
  searchQuery: string = '';
  sortOrder: 'asc' | 'desc' | '' = '';
  formErrors: { [key: string]: string } = {};
  errorMessage: string | null = null;

  constructor(
    private authService: AuthService,
    private vehicleService: VehicleService,
    private clientService: ClientService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    const role = this.authService.getUserRole();
    console.log('Rôle utilisateur:', role);
    if (role === 'ADMIN' || role === 'MANAGER') {
      this.loadVehicles();
      this.loadClients();
    } else {
      this.errorMessage = 'Accès interdit : vous devez être administrateur ou manager.';
      this.toastr.error(this.errorMessage);
    }
  }

  loadVehicles(): void {
    this.vehicleService.getAllVehicles().subscribe({
      next: (vehicles) => {
        this.vehicles = vehicles;
        this.filteredVehicles = vehicles;
        this.errorMessage = null;
        console.log('Véhicules chargés:', vehicles);
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = err.message || 'Erreur lors du chargement des véhicules';
        this.toastr.error(this.errorMessage);
        console.error('Erreur:', err);
        this.cdr.detectChanges();
      }
    });
  }

  loadClients(): void {
    this.clientService.getAllClients().subscribe({
      next: (clients) => {
        this.clients = clients;
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.toastr.error(err.message || 'Erreur lors du chargement des clients');
        console.error('Erreur:', err);
        this.cdr.detectChanges();
      }
    });
  }

  validateForm(): boolean {
    this.formErrors = {};
    if (!this.selectedVehicle.licensePlate || this.selectedVehicle.licensePlate.length < 3) {
      this.formErrors['licensePlate'] = 'La plaque d\'immatriculation doit contenir au moins 3 caractères.';
    }
    if (!this.selectedVehicle.brand || this.selectedVehicle.brand.length < 2) {
      this.formErrors['brand'] = 'La marque doit contenir au moins 2 caractères.';
    }
    if (!this.selectedVehicle.model || this.selectedVehicle.model.length < 2) {
      this.formErrors['model'] = 'Le modèle doit contenir au moins 2 caractères.';
    }
    if (!this.selectedVehicle.fuelType || !['Essence', 'Diesel', 'Électrique', 'Hybride'].includes(this.selectedVehicle.fuelType)) {
      this.formErrors['fuelType'] = 'Le type de carburant doit être Essence, Diesel, Électrique ou Hybride.';
    }
    if (!this.selectedVehicle.year || this.selectedVehicle.year < 1900 || this.selectedVehicle.year > new Date().getFullYear()) {
      this.formErrors['year'] = `L\'année doit être entre 1900 et ${new Date().getFullYear()}.`;
    }
    if (!this.selectedClientId || this.selectedClientId <= 0) {
      this.formErrors['client'] = 'Veuillez sélectionner un client valide.';
    }

    if (Object.keys(this.formErrors).length > 0) {
      this.toastr.error('Veuillez corriger les erreurs dans le formulaire.');
      return false;
    }
    return true;
  }

  createOrUpdateVehicle(): void {
    if (!this.validateForm()) {
      this.cdr.detectChanges();
      return;
    }

    const vehiclePayload: VehiclePayload = {
      licensePlate: this.selectedVehicle.licensePlate,
      brand: this.selectedVehicle.brand,
      model: this.selectedVehicle.model,
      fuelType: this.selectedVehicle.fuelType,
      year: this.selectedVehicle.year,
      client: { id: this.selectedClientId! }
    };

    if (this.isEditing) {
      vehiclePayload.id = this.selectedVehicle.id;
      this.vehicleService.updateVehicle(this.selectedVehicle.id!, vehiclePayload).subscribe({
        next: (updatedVehicle) => {
          this.toastr.success(`Véhicule ${updatedVehicle.licensePlate} mis à jour avec succès`);
          this.resetForm();
          this.loadVehicles();
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = err.message || 'Erreur lors de la mise à jour du véhicule';
          this.toastr.error(this.errorMessage);
          console.error('Erreur:', err);
          this.cdr.detectChanges();
        }
      });
    } else {
      this.vehicleService.createVehicle(vehiclePayload).subscribe({
        next: (newVehicle) => {
          this.toastr.success(`Véhicule ${newVehicle.licensePlate} ajouté avec succès`);
          this.resetForm();
          this.loadVehicles();
          console.log('Véhicule ajouté:', newVehicle);
          this.cdr.detectChanges();
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = err.message || 'Erreur lors de l\'ajout du véhicule';
          this.toastr.error(this.errorMessage);
          console.error('Erreur:', err);
          this.cdr.detectChanges();
        }
      });
    }
  }

  selectVehicle(vehicle: Vehicle): void {
    this.selectedVehicle = { ...vehicle };
    this.selectedClientId = vehicle.client?.id;
    this.isEditing = true;
    this.formErrors = {};
    this.errorMessage = null;
    this.cdr.detectChanges();
  }

  deleteVehicle(id: number): void {
    if (confirm('Voulez-vous vraiment supprimer ce véhicule ?')) {
      this.vehicleService.deleteVehicle(id).subscribe({
        next: () => {
          this.toastr.success('Véhicule supprimé avec succès');
          this.resetForm();
          this.loadVehicles();
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = err.message || 'Erreur lors de la suppression du véhicule';
          this.toastr.error(this.errorMessage);
          console.error('Erreur:', err);
          this.cdr.detectChanges();
        }
      });
    }
  }

  resetForm(): void {
    this.selectedVehicle = {
      licensePlate: '',
      brand: '',
      model: '',
      fuelType: '',
      year: 0,
      client: undefined
    };
    this.selectedClientId = undefined;
    this.isEditing = false;
    this.formErrors = {};
    this.errorMessage = null;
    this.cdr.detectChanges();
  }

  searchVehicles(): void {
    this.applyFiltersAndSearch();
  }

  sortVehicles(order: 'asc' | 'desc'): void {
    this.sortOrder = order;
    this.applyFiltersAndSearch();
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.sortOrder = '';
    this.applyFiltersAndSearch();
  }

  private applyFiltersAndSearch(): void {
    let result = [...this.vehicles];

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(vehicle =>
        (vehicle.licensePlate?.toLowerCase().includes(query) ?? false) ||
        (vehicle.brand?.toLowerCase().includes(query) ?? false) ||
        (vehicle.model?.toLowerCase().includes(query) ?? false) ||
        (vehicle.fuelType?.toLowerCase().includes(query) ?? false)
      );
    }

    if (this.sortOrder) {
      result.sort((a, b) => {
        const nameA = a.licensePlate.toLowerCase();
        const nameB = b.licensePlate.toLowerCase();
        return this.sortOrder === 'asc'
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      });
    }

    this.filteredVehicles = result;
    this.cdr.detectChanges();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}