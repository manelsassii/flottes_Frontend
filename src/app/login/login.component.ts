import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  credentials = { username: '', password: '' };
  errorMessage: string = '';
  successMessage: string = '';
  isSubmitting: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(): void {
    if (this.isSubmitting) return;

    if (!this.credentials.username || !this.credentials.password) {
      this.errorMessage = 'Le nom d\'utilisateur et le mot de passe sont requis';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.login(this.credentials).subscribe({
      next: (response: { token?: string; error?: string }) => {
        this.isSubmitting = false;
        if (response.token) {
          this.successMessage = 'Connexion réussie ! Redirection...';
          localStorage.setItem('jwtToken', response.token);
          setTimeout(() => {
            if (this.authService.isLoggedIn()) {
              const role = this.authService.getUserRole();
              console.log('Rôle détecté après login:', role); // Ajout pour débogage
              const redirectPath = role === 'ADMIN' ? '/admin/dashboard' : role === 'MANAGER' ? '/manager/dashboard' : '/dashboard';
              this.router.navigate([redirectPath]).then(() => {
                console.log('Redirection vers:', redirectPath); // Vérifie la redirection
              }).catch(err => {
                console.error('Erreur de redirection:', err);
                this.errorMessage = 'Erreur lors de la redirection';
              });
            } else {
              this.errorMessage = 'Erreur : JWT non stocké correctement';
            }
          }, 1500);
        } else if (response.error) {
          this.errorMessage = response.error;
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting = false;
        this.errorMessage = err.message || 'Erreur lors de la connexion';
        console.error('Erreur:', err);
      }
    });
  }

  navigateToRegister() {
    // Temporairement désactiver la vérification du rôle pour créer un premier admin
    this.router.navigate(['/register']);
  }
}