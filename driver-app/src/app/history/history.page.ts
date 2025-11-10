// src/app/history/history.page.ts
import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface FuelRecord {
  id: number;
  quantity: number;
  cost: number;
  refuelDate: string;
}

interface HistoryItem {
  date: string;
  quantity: number;
  cost: number;
  id: number;
}

@Component({
  selector: 'app-history',
  templateUrl: './history.page.html',
  styleUrls: ['./history.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]  // ← ÇA CORRIGE ion-content, ion-header, etc.

})
export class HistoryPage implements OnInit {
  history: HistoryItem[] = [];
  page = 1;
  private vehicleId = 1;

  constructor(
    public authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadHistory();
  }



  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  loadHistory() {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);
    this.http.get<FuelRecord[]>(`/api/fuel-consumptions?vehicleId=${this.vehicleId}&page=${this.page}&size=20`).subscribe(
      (data) => {
        const newItems = data.map(r => ({
          id: r.id,
          quantity: r.quantity,
          cost: r.cost || 0,
          date: r.refuelDate.split('T')[0]
        }));
        this.history = [...this.history, ...newItems];
      }
    );
  }

  loadMore() {
    this.page++;
    this.loadHistory();
  }

  deleteRecord(record: HistoryItem) {
    this.http.delete(`/api/fuel-consumptions/${record.id}`).subscribe(
      () => {
        this.history = this.history.filter(r => r.id !== record.id);
      }
    );
  }
}