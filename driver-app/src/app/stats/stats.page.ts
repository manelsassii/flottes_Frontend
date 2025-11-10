// src/app/stats/stats.page.ts
import { Component, AfterViewInit, ViewChild, ElementRef , CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Chart } from 'chart.js/auto';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.page.html',
  styleUrls: ['./stats.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]  // ← ÇA CORRIGE ion-content, ion-header, etc.
})
export class StatsPage implements AfterViewInit {
  @ViewChild('monthlyChart') chartRef!: ElementRef<HTMLCanvasElement>;
  private chart!: Chart;

  constructor(public authService: AuthService, private router: Router) {}

  ngAfterViewInit() {
    this.createChart();
  }

 

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private createChart() {
    const ctx = this.chartRef.nativeElement.getContext('2d');
    if (ctx) {
      this.chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
          datasets: [{
            label: 'Litres',
            data: [280, 300, 290, 310, 320, 295],
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: '#36A2EB',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          scales: { y: { beginAtZero: true } }
        }
      });
    }
  }
}