import type { Vehicle } from '../types';
import { trains } from './trains';
import { cars } from './cars';
import { planes } from './planes';
import { boats } from './boats';
import { construction } from './construction';
import { emergency } from './emergency';

export const vehicles: Vehicle[] = [
  ...trains,
  ...cars,
  ...planes,
  ...boats,
  ...construction,
  ...emergency,
];
