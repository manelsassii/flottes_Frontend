import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private alertsSubject = new Subject<any[]>();
  alerts$ = this.alertsSubject.asObservable();
  private resolvedSubject = new Subject<boolean>();
  resolved$ = this.resolvedSubject.asObservable();

  sendAlerts(alerts: any[]) {
    this.alertsSubject.next(alerts);
  }

  markResolved() {
    this.resolvedSubject.next(true);
  }
}