import { describe, it, expect } from 'vitest';
import { getNeighbors, vehiclesInCategory } from './navigation';
import type { Vehicle } from '../data/types';

function makeVehicle(id: string, category: Vehicle['category']): Vehicle {
  return {
    id,
    nameZh: `车${id}`,
    nameEn: `Car ${id}`,
    category,
    image: `/images/vehicles/${id}.webp`,
    factZh: '一句话小知识',
    imageSource: { url: 'https://example.com', license: 'CC0' },
  };
}

const list = [makeVehicle('a', 'trains'), makeVehicle('b', 'trains'), makeVehicle('c', 'trains')];

describe('getNeighbors', () => {
  it('中间条目返回正确的前后邻居', () => {
    const result = getNeighbors(list, 'b');
    expect(result?.prev.id).toBe('a');
    expect(result?.next.id).toBe('c');
  });

  it('第一条的 prev 环绕到最后一条', () => {
    const result = getNeighbors(list, 'a');
    expect(result?.prev.id).toBe('c');
    expect(result?.next.id).toBe('b');
  });

  it('最后一条的 next 环绕到第一条', () => {
    const result = getNeighbors(list, 'c');
    expect(result?.next.id).toBe('a');
  });

  it('单元素列表的前后邻居都是自身', () => {
    const single = [makeVehicle('only', 'boats')];
    const result = getNeighbors(single, 'only');
    expect(result?.prev.id).toBe('only');
    expect(result?.next.id).toBe('only');
  });

  it('未知 id 返回 undefined', () => {
    expect(getNeighbors(list, 'nope')).toBeUndefined();
  });
});

describe('vehiclesInCategory', () => {
  it('只返回指定类别', () => {
    const mixed = [makeVehicle('a', 'trains'), makeVehicle('b', 'boats')];
    expect(vehiclesInCategory(mixed, 'trains').map((v) => v.id)).toEqual(['a']);
  });

  it('无匹配返回空数组', () => {
    expect(vehiclesInCategory(list, 'planes')).toEqual([]);
  });
});
