import { describe, it, expect } from 'vitest';
import { vehicles } from './vehicles';
import { categories } from './categories';

describe('完整性校验（MVP 验收）', () => {
  it('6 大类全部有数据', () => {
    expect(categories).toHaveLength(6);
    for (const c of categories) {
      const count = vehicles.filter((v) => v.category === c.id).length;
      expect(count, `${c.nameZh} 缺少数据`).toBeGreaterThan(0);
    }
  });

  it('每类至少 8 条、总计至少 48 条', () => {
    for (const c of categories) {
      const count = vehicles.filter((v) => v.category === c.id).length;
      expect(count, `${c.nameZh} 只有 ${count} 条`).toBeGreaterThanOrEqual(8);
    }
    expect(vehicles.length).toBeGreaterThanOrEqual(48);
  });
});
