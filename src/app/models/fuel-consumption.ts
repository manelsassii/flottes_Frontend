export interface Vehicle {
  id: number;
  licensePlate?: string;
  brand?: string;
  model?: string;
  fuelType?: string;
  year?: number;
  client?: Client;
}

export interface Client {
  id: number;
  companyName?: string;
}

export interface FuelConsumption {
  id?: number;
  quantity?: number;
  cost?: number;
  refuelDate?: string;
  odometerReading?: number;
  vehicleId?: number;
  fuelType?: string;
  vehicle?: Vehicle;
}