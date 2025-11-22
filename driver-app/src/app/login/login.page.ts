import { Component, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastController, LoadingController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource, CameraDirection } from '@capacitor/camera'; // ← ÇA !
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CameraService } from '../services/camera.service';

declare const faceapi: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  providers: [CameraService]   // ← AJOUTE CETTE LIGNE MAGIQUE
})
export class LoginPage {
  email: string = '';
  password: string = '';
  @ViewChild('loginForm') loginForm!: NgForm;

  private modelsLoaded = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private cameraService: CameraService
  ) {
    this.loadFaceModels();
  }

  async loadFaceModels() {
    if (this.modelsLoaded) return;

    const loading = await this.loadingController.create({
      message: 'Chargement IA faciale... (10-15s)',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      await faceapi.nets.ssdMobilenetv1.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights');
      await faceapi.nets.faceLandmark68Net.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights');
      await faceapi.nets.faceRecognitionNet.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights');

      this.modelsLoaded = true;
      await loading.dismiss();
      this.showToast('Reconnaissance faciale prête !', 'success');
    } catch (e) {
      console.error('Erreur CDN :', e);
      await loading.dismiss();
      this.showToast('Erreur chargement (WiFi requis)', 'danger');
    }
  }

async loginWithFace() {
  if (!this.modelsLoaded) {
    this.showToast('IA pas encore chargée...', 'warning');
    return;
  }

  try {
    const dataUrl = await this.cameraService.takePhoto();
    await this.processFacePhoto(dataUrl);
  } catch (err) {
    this.showToast('Photo refusée → choisis depuis la galerie', 'warning');
    this.loginWithFaceFile();
  }
}

  private async processFacePhoto(dataUrl: string) {
    const analyzing = await this.loadingController.create({ 
      message: 'Analyse du visage...' 
    });
    await analyzing.present();

    const img = new Image();
    img.src = dataUrl;
    await img.decode();

    const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();

    if (!detection?.descriptor) {
      await analyzing.dismiss();
      this.showToast('Aucun visage détecté', 'danger');
      return;
    }

    const currentDescriptor = Array.from(detection.descriptor);
    const saved = localStorage.getItem('driver_face_agil');

    if (!saved) {
      localStorage.setItem('driver_face_agil', JSON.stringify(currentDescriptor));
      await analyzing.dismiss();
      this.showToast('Visage enregistré ! Bienvenue', 'success');
      this.router.navigateByUrl('/driver-dashboard', { replaceUrl: true });
    } else {
      const distance = faceapi.euclideanDistance(currentDescriptor, JSON.parse(saved));
      await analyzing.dismiss();
      if (distance < 0.55) {
        this.showToast(`Connexion réussie ! (${distance.toFixed(3)})`, 'success');
        this.router.navigateByUrl('/driver-dashboard', { replaceUrl: true });
      } else {
        this.showToast(`Refusé (${distance.toFixed(3)})`, 'danger');
      }
    }
  }

  private loginWithFaceFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'user';

    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      await this.processFacePhoto(url);
    };

    input.click();
  }

  async onLogin(form: NgForm) {
    if (form.invalid) {
      this.showToast('Veuillez remplir tous les champs', 'danger');
      return;
    }
    try {
      await this.authService.login(this.email, this.password).toPromise();
      this.router.navigateByUrl('/driver-dashboard', { replaceUrl: true });
      this.showToast('Connexion classique réussie !', 'success');
    } catch (error: any) {
      this.showToast(error.message || 'Erreur de connexion', 'danger');
    }
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }

  
}