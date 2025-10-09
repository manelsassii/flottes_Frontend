import { Client } from './client';

export interface Vehicle {
    id?: number;
    licensePlate: string;
    brand: string;
    model: string;
    fuelType: string;
    year: number;
    client?: Client;
}




