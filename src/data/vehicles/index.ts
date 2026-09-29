import type { Vehicle } from '../types';
import { trains } from './trains';
import { cars } from './cars';

export const vehicles: Vehicle[] = [...trains, ...cars];
