import type { Vehicle } from '../types';
import { trains } from './trains';
import { cars } from './cars';
import { planes } from './planes';

export const vehicles: Vehicle[] = [...trains, ...cars, ...planes];
