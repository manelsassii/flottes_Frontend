import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  canActivate(): boolean {
    console.log('AuthGuard: Vérification de l\'authentification');
    if (this.authService.isLoggedIn()) {
      console.log('AuthGuard: Utilisateur connecté');
      return true;
    } else {
      this.toastr.error('Veuillez vous connecter.');
      this.router.navigate(['/login']);
      return false;
    }
  }
}