export interface Driver {
  id: number; // Obligatoire
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  vehicleId?: number; // Optionnel
}



export interface DriverRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  vehicleId?: number;
  password: string; // Champ pour le manager
}