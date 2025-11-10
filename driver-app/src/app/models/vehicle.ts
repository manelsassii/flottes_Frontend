// src/app/models/vehicle.model.ts
export interface Vehicle {
  id: number;
  licensePlate: string;
  brand: string;
  model: string;
  fuelType: string;
  year: number;
  client: {
    id: number;
  };
}