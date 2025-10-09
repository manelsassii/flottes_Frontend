import { TestBed } from '@angular/core/testing';

import { FuelConsumptionService } from './fuel-consumption.service';

describe('FuelConsumptionService', () => {
  let service: FuelConsumptionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FuelConsumptionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
