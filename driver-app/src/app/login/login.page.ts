import { Component, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastController } from '@ionic/angular';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule],
})
export class LoginPage {
  email: string = '';
  password: string = '';

  @ViewChild('loginForm') loginForm!: NgForm;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController
  ) {}

  async onLogin(form: NgForm) {
    if (form.invalid) {
      const toast = await this.toastController.create({
        message: 'Veuillez remplir tous les champs correctement.',
        duration: 2000,
        color: 'danger',
      });
      toast.present();
      return;
    }

    try {
      await this.authService.login(this.email, this.password).toPromise();
      console.log('Connexion réussie :', this.authService.isLoggedIn());
      if (this.authService.isLoggedIn()) {
        const email = this.authService.getUserEmail();
        console.log('Redirection vers driver-dashboard pour', email);
        await this.router.navigate(['/driver-dashboard']); // Utilisation d'await pour gérer les erreurs
        const toast = await this.toastController.create({
          message: 'Connexion réussie !',
          duration: 2000,
          color: 'success',
        });
        toast.present();
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Email ou mot de passe incorrect. Veuillez réessayer.';
      const toast = await this.toastController.create({
        message: errorMessage,
        duration: 2000,
        color: 'danger',
      });
      toast.present();
      console.error('Erreur de connexion:', error);
    }
  }
}