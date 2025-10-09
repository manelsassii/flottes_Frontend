import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class DriverGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
  if (this.authService.isLoggedIn() && this.authService.getUserRole() === 'DRIVER') {
    return true;
  }
  this.router.navigate(['/driver/login']); // Redirige vers le login conducteur
  return false;
}
}