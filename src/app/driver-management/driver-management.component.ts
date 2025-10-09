import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { DriverService } from '../driver.service';
import { Driver } from '../models/driver';
import { Vehicle } from '../models/vehicle';
import { VehicleService } from '../vehicle.service';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../auth.service';
import { DriverRequest } from '../models/driver';

// Exporte l'interface DriverResponse
export interface DriverResponse {
  driver: Driver;
  username: string;
  password: string;
}

@Component({
  selector: 'app-driver-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './driver-management.component.html',
  styleUrls: ['./driver-management.component.css']
})
export class DriverManagementComponent implements OnInit {
  drivers: Driver[] = [];
  vehicles: Vehicle[] = [];
  errorMessage: string | null = null;
  newDriver: DriverRequest = { firstName: '', lastName: '', email: '', phone: '', vehicleId: undefined, password: '' };
  editingDriver: Driver | null = null;
  @ViewChild('addForm') addForm!: NgForm;

  constructor(
    private driverService: DriverService,
    private vehicleService: VehicleService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadDrivers();
    this.loadVehicles();
  }

  loadDrivers(): void {
    this.driverService.getAllDrivers().subscribe({
      next: (drivers: Driver[]) => {
        this.drivers = drivers;
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = err.status === 404 ? 'Aucune donnée de conducteurs trouvée (vérifiez le backend)' : err.message || 'Erreur lors du chargement des conducteurs';
        this.toastr.error(this.errorMessage);
        console.error('Erreur:', err);
        this.cdr.detectChanges();
      }
    });
  }

  loadVehicles(): void {
    this.vehicleService.getAllVehicles().subscribe({
      next: (vehicles: Vehicle[]) => {
        this.vehicles = vehicles;
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = err.status === 404 ? 'Aucune donnée de véhicules trouvée (vérifiez le backend)' : err.message || 'Erreur lors du chargement des véhicules';
        this.toastr.error(this.errorMessage);
        console.error('Erreur:', err);
        this.cdr.detectChanges();
      }
    });
  }

  addDriver(): void {
    if (this.addForm.invalid) {
      this.toastr.error('Veuillez remplir tous les champs requis.');
      return;
    }
    // Vérifie que le password est valide
    if (!this.newDriver.password || this.newDriver.password.trim().length < 6) { // Minimum 6 caractères pour sécurité
      this.toastr.error('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    // Envoie la requête
    this.driverService.createDriver(this.newDriver).subscribe({
      next: (response: DriverResponse) => {
        this.drivers.push(response.driver);
        this.newDriver = { firstName: '', lastName: '', email: '', phone: '', vehicleId: undefined, password: '' };
        this.addForm.resetForm();
        const message = `Cher ${response.driver.firstName}, votre compte a été créé. Nom d'utilisateur : ${response.username}, Mot de passe : ${response.password}. Téléchargez l'application mobile pour vous connecter.`;
        this.toastr.success(message);
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = err.status === 404 ? 'Endpoint non trouvé (vérifiez le backend)' : err.message || 'Erreur lors de l\'ajout du conducteur';
        this.toastr.error(this.errorMessage);
        console.error('Erreur:', err);
        this.cdr.detectChanges();
      }
    });
  }

  editDriver(driver: Driver): void {
    this.editingDriver = { ...driver };
  }

  updateDriver(): void {
    if (this.editingDriver && this.editingDriver.id) {
      this.driverService.updateDriver(this.editingDriver.id, this.editingDriver).subscribe({
        next: (updatedDriver) => {
          const index = this.drivers.findIndex(d => d.id === updatedDriver.id);
          if (index !== -1) {
            this.drivers[index] = updatedDriver;
            this.editingDriver = null;
            this.toastr.success('Conducteur mis à jour avec succès.');
            this.cdr.detectChanges();
          }
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = err.status === 404 ? 'Endpoint non trouvé (vérifiez le backend)' : err.message || 'Erreur lors de la mise à jour du conducteur';
          this.toastr.error(this.errorMessage);
          console.error('Erreur:', err);
          this.cdr.detectChanges();
        }
      });
    }
  }

  deleteDriver(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce conducteur ?')) {
      this.driverService.deleteDriver(id).subscribe({
        next: () => {
          this.drivers = this.drivers.filter(d => d.id !== id);
          this.toastr.success('Conducteur supprimé avec succès.');
          this.cdr.detectChanges();
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = err.status === 404 ? 'Endpoint non trouvé (vérifiez le backend)' : err.message || 'Erreur lors de la suppression du conducteur';
          this.toastr.error(this.errorMessage);
          console.error('Erreur:', err);
          this.cdr.detectChanges();
        }
      });
    }
  }

  getVehiclePlate(vehicleId: number | undefined): string {
    if (vehicleId === undefined) return 'Non assigné';
    const vehicle = this.vehicles.find(v => v.id === vehicleId);
    return vehicle ? vehicle.licensePlate : 'Non assigné';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}