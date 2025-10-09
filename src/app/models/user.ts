export interface User {
  username: string;
  password: string;
  email: string; // Optionnel, car non requis dans le backend
  role: string; // Optionnel, car le backend définit un rôle par défaut
}