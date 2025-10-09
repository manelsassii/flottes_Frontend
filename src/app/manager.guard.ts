// src/app/manager.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class ManagerGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router, private toastr: ToastrService) {}

  canActivate(): boolean {
    if (this.authService.isLoggedIn() && this.authService.getUserRole() === 'MANAGER') {
      return true;
    }
    this.toastr.error('Accès interdit : réservé aux managers.');
    this.router.navigate(['/login']);
    return false;
  }
}