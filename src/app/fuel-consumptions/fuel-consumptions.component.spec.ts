import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FuelConsumptionsComponent } from './fuel-consumptions.component';

describe('FuelConsumptionsComponent', () => {
  let component: FuelConsumptionsComponent;
  let fixture: ComponentFixture<FuelConsumptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FuelConsumptionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FuelConsumptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
