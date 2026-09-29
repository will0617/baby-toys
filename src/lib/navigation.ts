import type { Vehicle } from '../data/types';

export function vehiclesInCategory(vehicles: Vehicle[], category: string): Vehicle[] {
  return vehicles.filter((v) => v.category === category);
}

export interface Neighbors {
  prev: Vehicle;
  next: Vehicle;
}

export function getNeighbors(vehicles: Vehicle[], id: string): Neighbors | undefined {
  const index = vehicles.findIndex((v) => v.id === id);
  if (index === -1) return undefined;
  const len = vehicles.length;
  return {
    prev: vehicles[(index - 1 + len) % len],
    next: vehicles[(index + 1) % len],
  };
}
