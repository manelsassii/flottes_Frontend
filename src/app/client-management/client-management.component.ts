import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { ClientService } from '../client.service';
import { Client } from '../models/client';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-client-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client-management.component.html',
  styleUrls: ['./client-management.component.css']
})
export class ClientManagementComponent implements OnInit {
  clients: Client[] = [];
  filteredClients: Client[] = [];
  selectedClient: Client = { name: '', companyName: '', address: '', contactEmail: '', contactPhone: '' };
  isEditing: boolean = false;
  searchQuery: string = '';
  sortOrder: 'asc' | 'desc' | '' = '';
  formErrors: { [key: string]: string } = {};
  systemStatus: string | null = null;

  constructor(
    private authService: AuthService,
    private clientService: ClientService,
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  // Initialisation
  ngOnInit(): void {
    console.log('ClientManagementComponent: Vérification de l\'authentification');
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    const role = this.authService.getUserRole();
    console.log('ClientManagementComponent: Rôle utilisateur:', role);
    if (role === 'ADMIN') {
      this.loadClients();
      this.checkSystemStatus();
    } else {
      this.toastr.error('Accès interdit : vous devez être administrateur.');
      this.router.navigate(['/login']);
    }
  }

  // Chargement des données
  loadClients(): void {
    this.clientService.getAllClients().subscribe({
      next: (clients) => {
        this.clients = clients;
        this.filteredClients = [...clients];
        console.log('Clients chargés:', clients);
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.handleError(err, 'Erreur lors du chargement des clients');
      }
    });
  }

  // Validation du formulaire
  validateForm(): boolean {
    this.formErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;

    if (!this.selectedClient.name || this.selectedClient.name.length < 2) {
      this.formErrors['name'] = 'Le nom doit contenir au moins 2 caractères.';
    }
    if (!this.selectedClient.companyName || this.selectedClient.companyName.length < 2) {
      this.formErrors['companyName'] = 'Le nom de l\'entreprise doit contenir au moins 2 caractères.';
    }
    if (!this.selectedClient.address || this.selectedClient.address.length < 5) {
      this.formErrors['address'] = 'L\'adresse doit contenir au moins 5 caractères.';
    }
    if (!this.selectedClient.contactEmail || !emailRegex.test(this.selectedClient.contactEmail)) {
      this.formErrors['contactEmail'] = 'Veuillez entrer un email valide.';
    }
    if (this.selectedClient.contactPhone && !phoneRegex.test(this.selectedClient.contactPhone)) {
      this.formErrors['contactPhone'] = 'Veuillez entrer un numéro de téléphone valide (ex. +1234567890).';
    }

    return Object.keys(this.formErrors).length === 0;
  }

  // Gestion des clients
  createOrUpdateClient(): void {
    if (!this.validateForm()) {
      this.toastr.error('Veuillez corriger les erreurs dans le formulaire.');
      this.cdr.detectChanges();
      return;
    }

    const clientPayload: Client = {
      id: this.selectedClient.id,
      name: this.selectedClient.name,
      companyName: this.selectedClient.companyName,
      address: this.selectedClient.address,
      contactEmail: this.selectedClient.contactEmail,
      contactPhone: this.selectedClient.contactPhone
    };

    if (this.isEditing && !clientPayload.id) {
      this.toastr.error('Erreur : ID du client manquant pour la mise à jour');
      return;
    }

    const apiCall = this.isEditing
      ? this.clientService.updateClient(clientPayload.id!, clientPayload)
      : this.clientService.createClient(clientPayload);

    apiCall.subscribe({
      next: (result) => {
        this.toastr.success(`Client ${clientPayload.companyName} ${this.isEditing ? 'mis à jour' : 'ajouté'} avec succès`);
        this.resetForm();
        this.loadClients();
      },
      error: (err: HttpErrorResponse) => {
        this.handleError(err, `Erreur lors de la ${this.isEditing ? 'mise à jour' : 'ajout'} du client`);
      }
    });
  }

  selectClient(client: Client): void {
    this.selectedClient = { ...client };
    this.isEditing = true;
    this.formErrors = {};
    this.cdr.detectChanges();
  }

  deleteClient(id: number): void {
    if (confirm('Voulez-vous vraiment supprimer ce client ?')) {
      this.clientService.deleteClient(id).subscribe({
        next: () => {
          this.toastr.success('Client supprimé avec succès');
          this.resetForm();
          this.loadClients();
        },
        error: (err: HttpErrorResponse) => {
          this.handleError(err, 'Erreur lors de la suppression du client');
        }
      });
    }
  }

  resetForm(): void {
    this.selectedClient = { name: '', companyName: '', address: '', contactEmail: '', contactPhone: '' };
    this.isEditing = false;
    this.formErrors = {};
    this.cdr.detectChanges();
  }

  // Filtres et tri
  searchClients(): void {
    this.applyFiltersAndSearch();
  }

  sortClients(order: 'asc' | 'desc'): void {
    this.sortOrder = order;
    this.applyFiltersAndSearch();
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.sortOrder = '';
    this.applyFiltersAndSearch();
  }

  private applyFiltersAndSearch(): void {
    this.filteredClients = [...this.clients].filter(client =>
      (!this.searchQuery ||
        (client.name?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
         client.companyName?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
         client.contactEmail?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
         client.contactPhone?.toLowerCase().includes(this.searchQuery.toLowerCase())))
    );

    if (this.sortOrder) {
      this.filteredClients.sort((a, b) => {
        const nameA = a.name || a.companyName;
        const nameB = b.name || b.companyName;
        return this.sortOrder === 'asc'
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      });
    }

    this.cdr.detectChanges();
  }

  // Export PDF
  async exportPDF(): Promise<void> {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Liste des Clients', 10, 10);
    doc.setFontSize(12);
    doc.text(`Date : ${new Date().toLocaleDateString()}`, 10, 20);

    let y = 30;
    this.filteredClients.forEach((client, index) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(`ID: ${client.id}, Nom: ${client.name}, Entreprise: ${client.companyName}, Email: ${client.contactEmail}`, 10, y);
      y += 10;
    });

    doc.save('clients-list.pdf');
    this.toastr.success('Exportation PDF réussie');
  }

  // Statut système
  checkSystemStatus(): void {
    this.http.get<{ status: string }>('http://localhost:8081/api/system/status').subscribe({
      next: (status) => {
        this.systemStatus = status.status;
        if (status.status === 'DOWN') {
          this.toastr.error('Système en panne, intervention requise !');
        } else {
          this.toastr.info(`Statut système : ${status.status}`);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.handleError(err, 'Erreur lors de la vérification du statut');
      }
    });
  }

  // Gestion des erreurs
  private handleError(err: HttpErrorResponse, defaultMessage: string): void {
    const errorMessage = err.message || defaultMessage;
    this.toastr.error(errorMessage);
    console.error('Erreur:', err);
    this.cdr.detectChanges();
  }
    // Authentification
  logout(): void {
    this.authService.logout();
    this.toastr.success('Déconnexion réussie');
    this.router.navigate(['/login']);
  }
}