// src/app/login/login.page.ts
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
      this.showToast('Veuillez remplir tous les champs.', 'danger');
      return;
    }

    try {
      await this.authService.login(this.email, this.password).toPromise();

      if (this.authService.isLoggedIn()) {
        // REDIRECTION PROPRE + FORCER LE CHANGEMENT DE PAGE
        await this.router.navigateByUrl('/driver-dashboard', { replaceUrl: true });
        this.showToast('Connexion réussie !', 'success');
      }
    } catch (error: any) {
      this.showToast(error.message || 'Erreur de connexion', 'danger');
    }
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
    });
    toast.present();
  }
}