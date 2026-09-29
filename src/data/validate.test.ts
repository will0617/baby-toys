import { describe, it, expect } from 'vitest';
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { vehicles } from './vehicles';
import { categories } from './categories';

const ALLOWED_EXACT = ['CC0', 'Public Domain', 'Unsplash License', 'Pexels License'];
const ALLOWED_PATTERN = /^CC BY(-SA)? [234]\.0$/;

describe('内容数据校验', () => {
  it('每个已有条目的类别至少 8 个条目', () => {
    for (const c of categories) {
      const count = vehicles.filter((v) => v.category === c.id).length;
      if (count > 0) {
        expect(count, `${c.nameZh} 只有 ${count} 个条目`).toBeGreaterThanOrEqual(8);
      }
    }
  });

  it('id 全局唯一', () => {
    const ids = vehicles.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('所有字段非空且小知识长度合规', () => {
    for (const v of vehicles) {
      expect(v.nameZh.trim().length, `${v.id} 缺中文名`).toBeGreaterThan(0);
      expect(v.nameEn.trim().length, `${v.id} 缺英文名`).toBeGreaterThan(0);
      expect(v.factZh.length, `${v.id} 小知识过短`).toBeGreaterThan(4);
      expect(v.factZh.length, `${v.id} 小知识超 60 字`).toBeLessThanOrEqual(60);
      expect(v.image, `${v.id} 图片路径应为 / 开头`).toMatch(/^\/images\/vehicles\/.+\.webp$/);
    }
  });

  it('category 值合法', () => {
    const ids = new Set(categories.map((c) => c.id));
    for (const v of vehicles) {
      expect(ids.has(v.category), `${v.id} 的 category "${v.category}" 非法`).toBe(true);
    }
  });

  it('图片均有来源 URL 且许可协议允许免费使用', () => {
    for (const v of vehicles) {
      expect(v.imageSource.url, `${v.id} 缺来源 URL`).toMatch(/^https?:\/\//);
      const license = v.imageSource.license;
      const ok = ALLOWED_EXACT.includes(license) || ALLOWED_PATTERN.test(license);
      expect(ok, `${v.id} 的许可 "${license}" 不在允许清单内`).toBe(true);
    }
  });

  it('图片文件存在且 ≤ 300KB', () => {
    for (const v of vehicles) {
      const p = resolve('public', v.image.slice(1));
      expect(existsSync(p), `缺少图片文件: ${v.image}`).toBe(true);
      if (existsSync(p)) {
        const kb = statSync(p).size / 1024;
        expect(kb, `${v.image} 有 ${kb.toFixed(0)}KB，超过 300KB`).toBeLessThanOrEqual(300);
      }
    }
  });
});
