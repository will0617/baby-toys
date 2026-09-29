import type { Vehicle } from '../data/types';

export function vehiclesInCategory(vehicles: Vehicle[], category: string): Vehicle[] {
  return vehicles.filter((v) => v.category === category);
}
