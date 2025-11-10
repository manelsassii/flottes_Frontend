// src/app/components/app-layout/app-layout.component.ts
import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-layout',
  templateUrl: './app-layout.component.html',
  styleUrls: ['./app-layout.component.scss'],
  standalone: true,
  imports: []
})
export class AppLayoutComponent {
  constructor(public authService: AuthService, private router: Router) {}

  toggleSidebar() {
    document.body.classList.toggle('sb-sidenav-toggled');
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}