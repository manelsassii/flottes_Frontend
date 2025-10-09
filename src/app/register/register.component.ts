import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  user = { username: '', email: '', password: '', role: 'ROLE_USER' };
  errorMessage: string = '';
  successMessage: string = '';
  isSubmitting: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Pas de vérification ici pour l'instant, car on veut permettre la création d'un premier admin
  }

  onSubmit(): void {
    if (this.isSubmitting) return;

    if (!this.user.username || !this.user.password || !this.user.email) {
      this.errorMessage = 'Le nom d\'utilisateur, l\'email et le mot de passe sont requis';
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.user.email)) {
      this.errorMessage = 'Veuillez entrer un email valide';
      return;
    }

    // Temporairement désactiver la vérification du rôle pour le premier admin
    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.register(this.user).subscribe({
      next: (response: { message: string }) => {
        this.isSubmitting = false;
        this.successMessage = response.message || 'Inscription réussie ! Veuillez vous connecter.';
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || err.message || 'Erreur lors de l\'inscription';
        console.error('Erreur complète:', err);
      }
    });
  }
}