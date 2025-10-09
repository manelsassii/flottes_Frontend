import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DriverDashboardPage } from './driver-dashboard.page';

describe('DriverDashboardPage', () => {
  let component: DriverDashboardPage;
  let fixture: ComponentFixture<DriverDashboardPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DriverDashboardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
