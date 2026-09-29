# 交通工具图鉴百科（baby-toys）执行计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个家长主导操作、1-3 岁孩子看和听的纯静态中英双语交通工具图鉴网站（Astro），含 6 大类 48+ 条目、点击发音、自动连播。

**Architecture:** Astro 静态站点（SSG），无后端。内容以 TypeScript 数据模块形式与代码分离（`src/data/`），构建时通过 `getStaticPaths` 生成全部分类页与详情页。交互（发音、自动连播）为单个详情页内的客户端脚本，零跨页状态管理。真实照片存放于 `public/images/vehicles/`，经脚本统一压缩为 WebP。数据完整性由 Vitest 校验。

**Tech Stack:** Astro 5、TypeScript（strict）、Vitest、sharp（图片压缩）、Web Speech API、原生 CSS。

**关联文档:** `docs/requirements.md`（需求分析 v1.0）

---

## 交付物与验收对照

| 需求验收标准（requirements.md §8） | 对应任务 |
|---|---|
| 1. 首页 6 大类入口 | Task 9 |
| 2. 每类 ≥8 条目，有照片和中英文名 | Task 3-8（数据+图片）、Task 10（展示） |
| 3. 详情页大图 + 点击中/英文发音 | Task 11、12、13 |
| 4. 一句话小知识完整展示 | Task 3-8（数据）、Task 11（展示） |
| 5. 自动连播循环当前类别、可退出 | Task 13 |
| 6. 375px 竖屏无横向滚动、可单手点击 | Task 9-13（CSS）、Task 15（验收） |
| 7. iOS Safari 发音实测 | Task 13（实现）、Task 15（实测清单） |
| 8. 图片免费商用 + attribution 页 | Task 3-8、Task 14 |
| 9. Lighthouse 移动端 Performance ≥ 90 | Task 15 |
| 10. 数据校验脚本通过 | Task 3-8、Task 12（validator） |

## 任务依赖关系

```
Task 1 (脚手架)
  └─ Task 2 (图片脚本)
       └─ Task 3 (数据层 + 火车) ──┬─ Task 4 (汽车)
                                   ├─ Task 5 (飞机)
                                   ├─ Task 6 (轮船)
                                   ├─ Task 7 (工程车)
                                   └─ Task 8 (应急车 + 完整性校验)
                                        └─ Task 9 (布局+首页)
                                             └─ Task 10 (分类页)
                                                  └─ Task 11 (导航函数 + 详情页静态版)
                                                       └─ Task 12 (发音模块)
                                                            └─ Task 13 (发音接线 + 自动连播)
                                                                 └─ Task 14 (图片来源页)
                                                                      └─ Task 15 (构建与性能验收)
                                                                           └─ Task 16 (部署)
```

Task 4-7 相互独立，可并行执行（由不同 subagent 同时进行，各自新增独立数据文件）。

## 文件结构总览

```
baby-toys/
├── package.json                  # 依赖与脚本
├── astro.config.mjs              # Astro 配置
├── tsconfig.json                 # TS strict
├── vitest.config.ts              # 测试配置
├── .gitignore
├── public/
│   ├── favicon.svg               # 🚂 emoji 图标
│   └── images/vehicles/          # 压缩后的 WebP 照片（48+ 张）
├── scripts/
│   └── optimize-image.mjs        # 图片压缩脚本（sharp）
├── src/
│   ├── data/
│   │   ├── types.ts              # Vehicle / Category 类型
│   │   ├── categories.ts         # 6 大类定义
│   │   ├── vehicles/
│   │   │   ├── trains.ts         # 火车数据（8 条）
│   │   │   ├── cars.ts           # 汽车数据（8 条）
│   │   │   ├── planes.ts         # 飞机数据（8 条）
│   │   │   ├── boats.ts          # 轮船数据（8 条）
│   │   │   ├── construction.ts   # 工程车数据（8 条）
│   │   │   ├── emergency.ts      # 应急车数据（8 条）
│   │   │   └── index.ts          # 汇总导出 vehicles
│   │   ├── validate.test.ts      # 结构化数据校验测试
│   │   └── completeness.test.ts  # 6 大类完整性校验（Task 8 加入）
│   ├── lib/
│   │   ├── navigation.ts         # 前后邻居 / 分类过滤纯函数
│   │   └── navigation.test.ts
│   ├── scripts/
│   │   ├── speak.ts              # Web Speech API 封装
│   │   ├── speak.test.ts
│   │   └── autoplay.ts           # 页内自动连播控制器
│   ├── layouts/
│   │   └── Layout.astro          # HTML 骨架 + 全局样式
│   ├── components/
│   │   └── VehicleCard.astro     # 分类页卡片
│   └── pages/
│       ├── index.astro           # 首页（6 大类）
│       ├── category/[category].astro
│       ├── vehicle/[id].astro    # 详情页（含发音与连播脚本）
│       └── attribution.astro     # 图片来源与致谢
└── docs/
    ├── requirements.md
    └── execution-plan.md         # 本文件
```

**命名与接口约定（后续任务共用，勿改名）：**

- `CategoryId = 'trains' | 'cars' | 'planes' | 'boats' | 'construction' | 'emergency'`
- `Vehicle` 字段：`id, nameZh, nameEn, category, image, factZh, imageSource{url,license,author?}`
- `image` 为以 `/` 开头的 public 路径，如 `/images/vehicles/steam-train.webp`
- 图片文件名 = `{Vehicle.id}.webp`
- `categories`（复数）导出类别数组；`vehicles`（复数）导出全部条目
- 纯函数：`pickVoice(voices, lang)`、`getNeighbors(list, id)`、`vehiclesInCategory(vehicles, category)`、`startAutoplay(views, startIndex, apply)`

---

## Task 1: 项目脚手架

**Files:**
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `.gitignore`
- Create: `public/favicon.svg`
- Create: `src/pages/index.astro`（临时占位，Task 9 会替换）

> 说明：本项目目录已存在 `docs/`，官方脚手架命令在非空目录会有交互提示。为保证确定性，**手工创建脚手架文件**（minimal 模板本身只有 5 个文件）。

- [ ] **Step 1: 创建 `package.json`**

```json
{
  "name": "baby-toys",
  "type": "module",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "vitest run",
    "validate": "vitest run src/data",
    "check": "astro check"
  },
  "devDependencies": {
    "@astrojs/check": "^0.9.4",
    "astro": "^5.0.0",
    "sharp": "^0.33.5",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: 创建 `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://baby-toys.example.com',
});
```

> `site` 用于生成绝对 URL，部署时替换为真实域名即可。

- [ ] **Step 3: 创建 `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict"
}
```

- [ ] **Step 4: 创建 `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
  },
});
```

- [ ] **Step 5: 创建 `.gitignore`**

```
node_modules/
dist/
.astro/
.DS_Store
*.log
.vercel/
.netlify/
```

- [ ] **Step 6: 创建 `public/favicon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="0.9em" font-size="90">🚂</text></svg>
```

- [ ] **Step 7: 创建临时 `src/pages/index.astro`**

```astro
<html lang="zh-CN">
  <head><meta charset="utf-8" /><title>baby-toys</title></head>
  <body><h1>脚手架 OK</h1></body>
</html>
```

- [ ] **Step 8: 安装依赖**

Run: `npm install`
Expected: 命令退出码 0，生成 `node_modules/`，无 `ERESOLVE` 错误。

- [ ] **Step 9: 启动开发服务器验证**

Run: `npm run dev`（后台运行），然后另开终端 `curl -s http://localhost:4321 | grep 脚手架`
Expected: 输出包含 `脚手架 OK`。验证后关闭 dev server。

- [ ] **Step 10: 初始化 Git 并提交**

```bash
git init
git add -A
git commit -m "chore: Astro 静态站脚手架"
```

---

## Task 2: 图片压缩脚本

**Files:**
- Create: `scripts/optimize-image.mjs`

- [ ] **Step 1: 创建 `scripts/optimize-image.mjs`**

```js
import sharp from 'sharp';

const [input, output] = process.argv.slice(2);

if (!input || !output) {
  console.error('用法: node scripts/optimize-image.mjs <输入图片> <输出.webp>');
  process.exit(1);
}

const MAX_BYTES = 300 * 1024;
let quality = 80;
let buffer;

do {
  buffer = await sharp(input)
    .rotate() // 依据 EXIF 自动纠正方向
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality })
    .toBuffer();
  if (buffer.length <= MAX_BYTES) break;
  quality -= 10;
} while (quality >= 40);

await sharp(buffer).toFile(output); // 落盘，校验通过

const kb = Math.round(buffer.length / 1024);
console.log(`${output} ${kb}KB (quality=${quality})`);

if (buffer.length > MAX_BYTES) {
  console.error(`警告: ${output} 仍超过 300KB，请更换主体更简洁的图片`);
  process.exit(1);
}
```

- [ ] **Step 2: 用合成大图自测脚本**

```bash
node --input-type=module -e "import sharp from 'sharp'; await sharp({ create: { width: 2000, height: 1500, channels: 3, background: '#87ceeb' } }).jpeg().toFile('/tmp/test-big.jpg'); console.log('已生成 /tmp/test-big.jpg');"
node scripts/optimize-image.mjs /tmp/test-big.jpg /tmp/test-out.webp
ls -l /tmp/test-out.webp
```

Expected: 第一条打印「已生成」；第二条打印 `/tmp/test-out.webp <数字>KB (quality=...)`，数字 ≤ 300；命令退出码 0。

- [ ] **Step 3: 提交**

```bash
git add scripts/optimize-image.mjs
git commit -m "feat: 添加图片压缩脚本（sharp → 1200px WebP ≤300KB）"
```

---

## Task 3: 数据层 + 火车数据（含图片）

**Files:**
- Create: `src/data/types.ts`
- Create: `src/data/categories.ts`
- Create: `src/data/vehicles/trains.ts`
- Create: `src/data/vehicles/index.ts`
- Create: `src/data/validate.test.ts`
- Create: `public/images/vehicles/*.webp`（8 张）

- [ ] **Step 1: 创建 `src/data/types.ts`**

```ts
export type CategoryId =
  | 'trains'
  | 'cars'
  | 'planes'
  | 'boats'
  | 'construction'
  | 'emergency';

export interface Category {
  id: CategoryId;
  nameZh: string;
  nameEn: string;
  emoji: string;
  description: string;
}

export interface ImageSource {
  /** 图片来源页 URL（版权追溯用） */
  url: string;
  /** 许可协议，如 'CC BY-SA 4.0' / 'CC0' / 'Unsplash License' */
  license: string;
  /** 作者/摄影者（协议要求署名时必填） */
  author?: string;
}

export interface Vehicle {
  /** 唯一 id，同时用于 URL 和图片文件名 */
  id: string;
  nameZh: string;
  nameEn: string;
  category: CategoryId;
  /** public 路径，如 '/images/vehicles/steam-train.webp' */
  image: string;
  /** 一句话小知识（中文，家长念给孩子听，≤60 字） */
  factZh: string;
  imageSource: ImageSource;
}
```

- [ ] **Step 2: 创建 `src/data/categories.ts`**

```ts
import type { Category } from './types';

export const categories: Category[] = [
  { id: 'trains', nameZh: '小火车', nameEn: 'Trains', emoji: '🚂', description: '呜——火车开动啦' },
  { id: 'cars', nameZh: '汽车', nameEn: 'Cars', emoji: '🚗', description: '嘀嘀，让一让' },
  { id: 'planes', nameZh: '飞机', nameEn: 'Planes', emoji: '✈️', description: '呼——飞上天空' },
  { id: 'boats', nameZh: '轮船', nameEn: 'Boats', emoji: '🚢', description: '呜呜，出海喽' },
  { id: 'construction', nameZh: '工程车', nameEn: 'Construction', emoji: '🚜', description: '开工啦，忙忙碌碌' },
  { id: 'emergency', nameZh: '应急车', nameEn: 'Emergency', emoji: '🚨', description: '呜哇呜哇，紧急出动' },
];
```

- [ ] **Step 3: 创建 `src/data/vehicles/trains.ts`**

> `imageSource` 三项先留空字符串，Step 5 下载图片时逐条填写。这是有意设计的红→绿循环：填完才能通过校验。

```ts
import type { Vehicle } from '../types';

export const trains: Vehicle[] = [
  {
    id: 'steam-train',
    nameZh: '蒸汽火车',
    nameEn: 'Steam Train',
    category: 'trains',
    image: '/images/vehicles/steam-train.webp',
    factZh: '蒸汽火车是最古老的火车，烧煤把水变成蒸汽来开动。',
    imageSource: { url: '', license: '', author: '' },
  },
  {
    id: 'high-speed-train',
    nameZh: '高铁',
    nameEn: 'High-Speed Train',
    category: 'trains',
    image: '/images/vehicles/high-speed-train.webp',
    factZh: '高铁是跑得最快的火车，一个小时能跑三百多公里。',
    imageSource: { url: '', license: '', author: '' },
  },
  {
    id: 'subway',
    nameZh: '地铁',
    nameEn: 'Subway Train',
    category: 'trains',
    image: '/images/vehicles/subway.webp',
    factZh: '地铁在城市的地底下开，不用等红绿灯。',
    imageSource: { url: '', license: '', author: '' },
  },
  {
    id: 'tram',
    nameZh: '有轨电车',
    nameEn: 'Tram',
    category: 'trains',
    image: '/images/vehicles/tram.webp',
    factZh: '有轨电车沿着地上的铁轨慢慢开，叮叮当当地响。',
    imageSource: { url: '', license: '', author: '' },
  },
  {
    id: 'freight-train',
    nameZh: '货运列车',
    nameEn: 'Freight Train',
    category: 'trains',
    image: '/images/vehicles/freight-train.webp',
    factZh: '货运列车身体特别长，能拉好多好多货物。',
    imageSource: { url: '', license: '', author: '' },
  },
  {
    id: 'green-train',
    nameZh: '绿皮火车',
    nameEn: 'Green Train',
    category: 'trains',
    image: '/images/vehicles/green-train.webp',
    factZh: '绿皮火车开得慢慢的，车厢是绿色的，窗户能打开。',
    imageSource: { url: '', license: '', author: '' },
  },
  {
    id: 'monorail',
    nameZh: '单轨列车',
    nameEn: 'Monorail',
    category: 'trains',
    image: '/images/vehicles/monorail.webp',
    factZh: '单轨列车骑在一条大梁上跑，像骑着独轮车。',
    imageSource: { url: '', license: '', author: '' },
  },
  {
    id: 'cog-railway',
    nameZh: '齿轨火车',
    nameEn: 'Cog Railway',
    category: 'trains',
    image: '/images/vehicles/cog-railway.webp',
    factZh: '齿轨火车用齿轮咬住轨道，能爬上陡陡的大山。',
    imageSource: { url: '', license: '', author: '' },
  },
];
```

- [ ] **Step 4: 创建 `src/data/vehicles/index.ts` 与 `src/data/validate.test.ts`**

`src/data/vehicles/index.ts`：

```ts
import type { Vehicle } from '../types';
import { trains } from './trains';

export const vehicles: Vehicle[] = [...trains];
```

`src/data/validate.test.ts`：

```ts
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
```

- [ ] **Step 5: 运行校验，确认失败（红）**

Run: `npm run validate`
Expected: **FAIL** —— 报「缺来源 URL」或「缺少图片文件: /images/vehicles/steam-train.webp」。这就是本任务要消灭的红灯。

- [ ] **Step 6: 下载并优化 8 张火车图片**

对下表中每个条目：

1. 打开 Wikimedia Commons 搜索页（第二列 URL），挑选「主体清晰、构图居中、背景不杂乱」的照片
2. 打开图片详情页，**确认许可为** CC BY / CC BY-SA / CC0 / Public domain（记录 `author` 与 `license`）
3. 下载原图到本地（如 `~/Downloads/`）
4. 运行 `node scripts/optimize-image.mjs ~/Downloads/<原图> public/images/vehicles/<id>.webp`
5. 把来源页 URL、许可、作者填入 `trains.ts` 对应条目的 `imageSource`

| id | 搜索关键词（Commons） |
|---|---|
| steam-train | `steam locomotive` |
| high-speed-train | `Shinkansen` 或 `China Railway high-speed train` |
| subway | `subway train station` |
| tram | `tram street` |
| freight-train | `freight train container` |
| green-train | `China Railway green train` 或 `Chinese passenger train green`（找不到时见下方替补） |
| monorail | `monorail train` |
| cog-railway | `rack railway` 或 `cog railway` |

> 找不到合适照片时，可用替补条目替换（保持每类 ≥8 条）。火车类替补：`内燃机车 Diesel Locomotive`、`双层列车 Double-Decker Train`。
>
> 可用 Unsplash 替代 Commons：搜索 `https://unsplash.com/s/photos/<关键词>`，许可填 `Unsplash License`。（Unsplash 不要求署名，`author` 可留空。）

- [ ] **Step 7: 运行校验，确认通过（绿）**

Run: `npm run validate`
Expected: **PASS**，6 个测试全部通过。

- [ ] **Step 8: 验证 Astro 能加载数据模块**

Run: `npm run check`
Expected: 退出码 0，无类型错误。

- [ ] **Step 9: 提交**

```bash
git add src/data public/images/vehicles scripts
git commit -m "feat: 数据层与火车图鉴 8 条（含图片与版权信息）"
```

---

## Task 4: 汽车数据

**Files:**
- Create: `src/data/vehicles/cars.ts`
- Modify: `src/data/vehicles/index.ts`
- Create: `public/images/vehicles/*.webp`（8 张）

- [ ] **Step 1: 创建 `src/data/vehicles/cars.ts`**

```ts
import type { Vehicle } from '../types';

export const cars: Vehicle[] = [
  {
    id: 'sedan',
    nameZh: '轿车',
    nameEn: 'Sedan',
    category: 'cars',
    image: '/images/vehicles/sedan.webp',
    factZh: '轿车是最常见的汽车，爸爸妈妈开着它接送宝宝。',
    imageSource: { url: '', license: '', author: '' },
  },
  {
    id: 'taxi',
    nameZh: '出租车',
    nameEn: 'Taxi',
    category: 'cars',
    image: '/images/vehicles/taxi.webp',
    factZh: '出租车顶上有个小灯牌，招招手它就停下来。',
    imageSource: { url: '', license: '', author: '' },
  },
  {
    id: 'bus',
    nameZh: '公交车',
    nameEn: 'Bus',
    category: 'cars',
    image: '/images/vehicles/bus.webp',
    factZh: '公交车又高又长，一趟能装下好多乘客。',
    imageSource: { url: '', license: '', author: '' },
  },
  {
    id: 'truck',
    nameZh: '卡车',
    nameEn: 'Truck',
    category: 'cars',
    image: '/images/vehicles/truck.webp',
    factZh: '卡车力气最大，车斗里装着满满的货物。',
    imageSource: { url: '', license: '', author: '' },
  },
  {
    id: 'sports-car',
    nameZh: '跑车',
    nameEn: 'Sports Car',
    category: 'cars',
    image: '/images/vehicles/sports-car.webp',
    factZh: '跑车车身矮矮的，跑起来像风一样快。',
    imageSource: { url: '', license: '', author: '' },
  },
  {
    id: 'suv',
    nameZh: '越野车',
    nameEn: 'SUV',
    category: 'cars',
    image: '/images/vehicles/suv.webp',
    factZh: '越野车轮子高高的，能爬山也能过小河。',
    imageSource: { url: '', license: '', author: '' },
  },
  {
    id: 'van',
    nameZh: '面包车',
    nameEn: 'Van',
    category: 'cars',
    image: '/images/vehicles/van.webp',
    factZh: '面包车肚子大大的，能坐人也能装东西。',
    imageSource: { url: '', license: '', author: '' },
  },
  {
    id: 'motorcycle',
    nameZh: '摩托车',
    nameEn: 'Motorcycle',
    category: 'cars',
    image: '/images/vehicles/motorcycle.webp',
    factZh: '摩托车只有两个轮子，骑的时候要戴好头盔。',
    imageSource: { url: '', license: '', author: '' },
  },
];
```

> 说明：本条目的第 8 项从「吉普车」调整为「摩托车」，因为 Commons 上摩托车照片质量与辨识度更高；若你更想保留吉普车，把 `id` 改为 `jeep`、`nameZh` 改「吉普车」、`nameEn` 改 `Jeep`，并相应搜索 `jeep off-road` 即可，其余步骤不变。

- [ ] **Step 2: 更新 `src/data/vehicles/index.ts`**

```ts
import type { Vehicle } from '../types';
import { trains } from './trains';
import { cars } from './cars';

export const vehicles: Vehicle[] = [...trains, ...cars];
```

- [ ] **Step 3: 运行校验，确认失败（红）**

Run: `npm run validate`
Expected: **FAIL** —— 报 cars 相关条目缺来源 URL / 缺图片。

- [ ] **Step 4: 下载并优化 8 张汽车图片**

流程同 Task 3 Step 6（Commons → 确认许可 → 下载 → `node scripts/optimize-image.mjs` → 填 `imageSource`）。

| id | 搜索关键词（Commons） |
|---|---|
| sedan | `sedan car` |
| taxi | `taxi cab yellow` |
| bus | `city bus` |
| truck | `cargo truck` |
| sports-car | `sports car` |
| suv | `SUV car` |
| van | `van vehicle` |
| motorcycle | `motorcycle` |

- [ ] **Step 5: 运行校验，确认通过（绿）**

Run: `npm run validate`
Expected: **PASS**。

- [ ] **Step 6: 提交**

```bash
git add src/data public/images/vehicles
git commit -m "feat: 汽车图鉴 8 条"
```

---

## Task 5: 飞机数据

**Files:**
- Create: `src/data/vehicles/planes.ts`
- Modify: `src/data/vehicles/index.ts`
- Create: `public/images/vehicles/*.webp`（8 张）

- [ ] **Step 1: 创建 `src/data/vehicles/planes.ts`**

```ts
import type { Vehicle } from '../types';

export const planes: Vehicle[] = [
  {
    id: 'airliner',
    nameZh: '大客机',
    nameEn: 'Airliner',
    category: 'planes',
    image: '/images/vehicles/airliner.webp',
    factZh: '大客机像一只大铁鸟，能带着人们飞过大海洋。',
    imageSource: { url: '', license: '', author: '' },
  },
  {
    id: 'helicopter',
    nameZh: '直升机',
    nameEn: 'Helicopter',
    category: 'planes',
    image: '/images/vehicles/helicopter.webp',
    factZh: '直升机头顶的螺旋桨转呀转，能直接飞上天空。',
    imageSource: { url: '', license: '', author: '' },
  },
  {
    id: 'propeller-plane',
    nameZh: '螺旋桨飞机',
    nameEn: 'Propeller Plane',
    category: 'planes',
    image: '/images/vehicles/propeller-plane.webp',
    factZh: '螺旋桨飞机靠前面的桨叶转动，推着自己往前飞。',
    imageSource: { url: '', license: '', author: '' },
  },
  {
    id: 'fighter-jet',
    nameZh: '战斗机',
    nameEn: 'Fighter Jet',
    category: 'planes',
    image: '/images/vehicles/fighter-jet.webp',
    factZh: '战斗机飞得比声音还快，保护着我们的天空。',
    imageSource: { url: '', license: '', author: '' },
  },
  {
    id: 'seaplane',
    nameZh: '水上飞机',
    nameEn: 'Seaplane',
    category: 'planes',
    image: '/images/vehicles/seaplane.webp',
    factZh: '水上飞机的肚子像小船，能直接停在河面上。',
    imageSource: { url: '', license: '', author: '' },
  },
  {
    id: 'hot-air-balloon',
    nameZh: '热气球',
    nameEn: 'Hot Air Balloon',
    category: 'planes',
    image: '/images/vehicles/hot-air-balloon.webp',
    factZh: '热气球是大大的气球，坐着它慢慢飘上天。',
    imageSource: { url: '', license: '', author: '' },
  },
  {
    id: 'glider',
    nameZh: '滑翔机',
    nameEn: 'Glider',
    category: 'planes',
    image: '/images/vehicles/glider.webp',
    factZh: '滑翔机没有发动机，像纸飞机一样乘着风飞。',
    imageSource: { url: '', license: '', author: '' },
  },
  {
    id: 'cargo-plane',
    nameZh: '货机',
    nameEn: 'Cargo Plane',
    category: 'planes',
    image: '/images/vehicles/cargo-plane.webp',
    factZh: '货机是圆滚滚的大飞机，肚子里能装下小汽车。',
    imageSource: { url: '', license: '', author: '' },
  },
];
```

- [ ] **Step 2: 更新 `src/data/vehicles/index.ts`**

```ts
import type { Vehicle } from '../types';
import { trains } from './trains';
import { cars } from './cars';
import { planes } from './planes';

export const vehicles: Vehicle[] = [...trains, ...cars, ...planes];
```

- [ ] **Step 3: 运行校验，确认失败（红）**

Run: `npm run validate`
Expected: **FAIL** —— 报 planes 相关条目缺来源/图片。

- [ ] **Step 4: 下载并优化 8 张飞机图片**

| id | 搜索关键词（Commons） |
|---|---|
| airliner | `airliner` 或 `Boeing 747` |
| helicopter | `helicopter flying` |
| propeller-plane | `propeller aircraft` |
| fighter-jet | `fighter jet` |
| seaplane | `seaplane` |
| hot-air-balloon | `hot air balloon` |
| glider | `glider aircraft` |
| cargo-plane | `cargo aircraft` |

> 替补：`无人机 Drone`、`私人小飞机 Light aircraft`。

- [ ] **Step 5: 运行校验，确认通过（绿）**

Run: `npm run validate`
Expected: **PASS**。

- [ ] **Step 6: 提交**

```bash
git add src/data public/images/vehicles
git commit -m "feat: 飞机图鉴 8 条"
```

---

## Task 6: 轮船数据

**Files:**
- Create: `src/data/vehicles/boats.ts`
- Modify: `src/data/vehicles/index.ts`
- Create: `public/images/vehicles/*.webp`（8 张）

- [ ] **Step 1: 创建 `src/data/vehicles/boats.ts`**

```ts
import type { Vehicle } from '../types';

export const boats: Vehicle[] = [
  {
    id: 'sailboat',
    nameZh: '帆船',
    nameEn: 'Sailboat',
    category: 'boats',
    image: '/images/vehicles/sailboat.webp',
    factZh: '帆船靠大风推着白帆，在水面上轻轻前进。',
    imageSource: { url: '', license: '', author: '' },
  },
  {
    id: 'cargo-ship',
    nameZh: '货轮',
    nameEn: 'Cargo Ship',
    category: 'boats',
    image: '/images/vehicles/cargo-ship.webp',
    factZh: '货轮是大大的船，能运几千个集装箱。',
    imageSource: { url: '', license: '', author: '' },
  },
  {
    id: 'yacht',
    nameZh: '游艇',
    nameEn: 'Yacht',
    category: 'boats',
    image: '/images/vehicles/yacht.webp',
    factZh: '游艇是小巧的漂亮船，在海上开心地兜风。',
    imageSource: { url: '', license: '', author: '' },
  },
  {
    id: 'ferry',
    nameZh: '渡轮',
    nameEn: 'Ferry',
    category: 'boats',
    image: '/images/vehicles/ferry.webp',
    factZh: '渡轮像水上的公交车，载着人们过江过海。',
    imageSource: { url: '', license: '', author: '' },
  },
  {
    id: 'fishing-boat',
    nameZh: '渔船',
    nameEn: 'Fishing Boat',
    category: 'boats',
    image: '/images/vehicles/fishing-boat.webp',
    factZh: '渔船每天出海捕鱼，带回来好吃的鱼和虾。',
    imageSource: { url: '', license: '', author: '' },
  },
  {
    id: 'kayak',
    nameZh: '皮划艇',
    nameEn: 'Kayak',
    category: 'boats',
    image: '/images/vehicles/kayak.webp',
    factZh: '皮划艇细细长长的，用小桨划着往前走。',
    imageSource: { url: '', license: '', author: '' },
  },
  {
    id: 'submarine',
    nameZh: '潜水艇',
    nameEn: 'Submarine',
    category: 'boats',
    image: '/images/vehicles/submarine.webp',
    factZh: '潜水艇能钻到水底下，悄悄地在水里前进。',
    imageSource: { url: '', license: '', author: '' },
  },
  {
    id: 'dragon-boat',
    nameZh: '龙舟',
    nameEn: 'Dragon Boat',
    category: 'boats',
    image: '/images/vehicles/dragon-boat.webp',
    factZh: '龙舟是长长的木船，大家一起划桨比赛谁最快。',
    imageSource: { url: '', license: '', author: '' },
  },
];
```

- [ ] **Step 2: 更新 `src/data/vehicles/index.ts`**

```ts
import type { Vehicle } from '../types';
import { trains } from './trains';
import { cars } from './cars';
import { planes } from './planes';
import { boats } from './boats';

export const vehicles: Vehicle[] = [...trains, ...cars, ...planes, ...boats];
```

- [ ] **Step 3: 运行校验，确认失败（红）**

Run: `npm run validate`
Expected: **FAIL** —— 报 boats 相关条目缺来源/图片。

- [ ] **Step 4: 下载并优化 8 张轮船图片**

| id | 搜索关键词（Commons） |
|---|---|
| sailboat | `sailboat` |
| cargo-ship | `container ship` |
| yacht | `yacht` |
| ferry | `ferry boat` |
| fishing-boat | `fishing boat` |
| kayak | `kayak` |
| submarine | `submarine` |
| dragon-boat | `dragon boat race` |

> 替补：`tugboat 拖船`、`speedboat 快艇`。

- [ ] **Step 5: 运行校验，确认通过（绿）**

Run: `npm run validate`
Expected: **PASS**。

- [ ] **Step 6: 提交**

```bash
git add src/data public/images/vehicles
git commit -m "feat: 轮船图鉴 8 条"
```

---

## Task 7: 工程车数据

**Files:**
- Create: `src/data/vehicles/construction.ts`
- Modify: `src/data/vehicles/index.ts`
- Create: `public/images/vehicles/*.webp`（8 张）

- [ ] **Step 1: 创建 `src/data/vehicles/construction.ts`**

```ts
import type { Vehicle } from '../types';

export const construction: Vehicle[] = [
  {
    id: 'excavator',
    nameZh: '挖掘机',
    nameEn: 'Excavator',
    category: 'construction',
    image: '/images/vehicles/excavator.webp',
    factZh: '挖掘机有大铁手臂，一铲子能挖起好多土。',
    imageSource: { url: '', license: '', author: '' },
  },
  {
    id: 'bulldozer',
    nameZh: '推土机',
    nameEn: 'Bulldozer',
    category: 'construction',
    image: '/images/vehicles/bulldozer.webp',
    factZh: '推土机前面有大铁板，把土推得平平的。',
    imageSource: { url: '', license: '', author: '' },
  },
  {
    id: 'crane',
    nameZh: '起重机',
    nameEn: 'Crane',
    category: 'construction',
    image: '/images/vehicles/crane.webp',
    factZh: '起重机有高高的长脖子，能吊起很重的东西。',
    imageSource: { url: '', license: '', author: '' },
  },
  {
    id: 'cement-mixer',
    nameZh: '混凝土搅拌车',
    nameEn: 'Cement Mixer',
    category: 'construction',
    image: '/images/vehicles/cement-mixer.webp',
    factZh: '搅拌车的大罐子转呀转，装着修马路的混凝土。',
    imageSource: { url: '', license: '', author: '' },
  },
  {
    id: 'road-roller',
    nameZh: '压路机',
    nameEn: 'Road Roller',
    category: 'construction',
    image: '/images/vehicles/road-roller.webp',
    factZh: '压路机有圆圆的大轮子，把马路压得平平的。',
    imageSource: { url: '', license: '', author: '' },
  },
  {
    id: 'loader',
    nameZh: '装载机',
    nameEn: 'Wheel Loader',
    category: 'construction',
    image: '/images/vehicles/loader.webp',
    factZh: '装载机前面有大铲子，把沙子铲进卡车里。',
    imageSource: { url: '', license: '', author: '' },
  },
  {
    id: 'dump-truck',
    nameZh: '翻斗车',
    nameEn: 'Dump Truck',
    category: 'construction',
    image: '/images/vehicles/dump-truck.webp',
    factZh: '翻斗车的车斗会翘起来，哗啦啦倒出砂石。',
    imageSource: { url: '', license: '', author: '' },
  },
  {
    id: 'forklift',
    nameZh: '叉车',
    nameEn: 'Forklift',
    category: 'construction',
    image: '/images/vehicles/forklift.webp',
    factZh: '叉车前面有两根铁叉，把货物举上又举下。',
    imageSource: { url: '', license: '', author: '' },
  },
];
```

- [ ] **Step 2: 更新 `src/data/vehicles/index.ts`**

```ts
import type { Vehicle } from '../types';
import { trains } from './trains';
import { cars } from './cars';
import { planes } from './planes';
import { boats } from './boats';
import { construction } from './construction';

export const vehicles: Vehicle[] = [...trains, ...cars, ...planes, ...boats, ...construction];
```

- [ ] **Step 3: 运行校验，确认失败（红）**

Run: `npm run validate`
Expected: **FAIL** —— 报 construction 相关条目缺来源/图片。

- [ ] **Step 4: 下载并优化 8 张工程车图片**

| id | 搜索关键词（Commons） |
|---|---|
| excavator | `excavator` |
| bulldozer | `bulldozer` |
| crane | `construction crane` |
| cement-mixer | `concrete mixer truck` |
| road-roller | `road roller` |
| loader | `wheel loader` |
| dump-truck | `dump truck` |
| forklift | `forklift` |

- [ ] **Step 5: 运行校验，确认通过（绿）**

Run: `npm run validate`
Expected: **PASS**。

- [ ] **Step 6: 提交**

```bash
git add src/data public/images/vehicles
git commit -m "feat: 工程车图鉴 8 条"
```

---

## Task 8: 应急车数据 + 完整性校验

**Files:**
- Create: `src/data/vehicles/emergency.ts`
- Modify: `src/data/vehicles/index.ts`
- Create: `src/data/completeness.test.ts`
- Create: `public/images/vehicles/*.webp`（8 张）

- [ ] **Step 1: 创建 `src/data/vehicles/emergency.ts`**

```ts
import type { Vehicle } from '../types';

export const emergency: Vehicle[] = [
  {
    id: 'fire-truck',
    nameZh: '消防车',
    nameEn: 'Fire Truck',
    category: 'emergency',
    image: '/images/vehicles/fire-truck.webp',
    factZh: '消防车是红色的，呜哇呜哇地跑去救火。',
    imageSource: { url: '', license: '', author: '' },
  },
  {
    id: 'ambulance',
    nameZh: '救护车',
    nameEn: 'Ambulance',
    category: 'emergency',
    image: '/images/vehicles/ambulance.webp',
    factZh: '救护车白白的，载着医生去帮助生病的人。',
    imageSource: { url: '', license: '', author: '' },
  },
  {
    id: 'police-car',
    nameZh: '警车',
    nameEn: 'Police Car',
    category: 'emergency',
    image: '/images/vehicles/police-car.webp',
    factZh: '警车闪着蓝色的警灯，保护大家的安全。',
    imageSource: { url: '', license: '', author: '' },
  },
  {
    id: 'tow-truck',
    nameZh: '清障车',
    nameEn: 'Tow Truck',
    category: 'emergency',
    image: '/images/vehicles/tow-truck.webp',
    factZh: '清障车有长长的吊钩，把坏掉的汽车拖走。',
    imageSource: { url: '', license: '', author: '' },
  },
  {
    id: 'rescue-helicopter',
    nameZh: '救援直升机',
    nameEn: 'Rescue Helicopter',
    category: 'emergency',
    image: '/images/vehicles/rescue-helicopter.webp',
    factZh: '救援直升机飞到山上，把需要帮助的人送到医院。',
    imageSource: { url: '', license: '', author: '' },
  },
  {
    id: 'fire-boat',
    nameZh: '消防艇',
    nameEn: 'Fire Boat',
    category: 'emergency',
    image: '/images/vehicles/fire-boat.webp',
    factZh: '消防艇会喷出高高的水柱，扑灭船上的火。',
    imageSource: { url: '', license: '', author: '' },
  },
  {
    id: 'patrol-boat',
    nameZh: '巡逻艇',
    nameEn: 'Patrol Boat',
    category: 'emergency',
    image: '/images/vehicles/patrol-boat.webp',
    factZh: '巡逻艇在大海上开得飞快，守护海边的安全。',
    imageSource: { url: '', license: '', author: '' },
  },
  {
    id: 'snow-plow',
    nameZh: '铲雪车',
    nameEn: 'Snow Plow',
    category: 'emergency',
    image: '/images/vehicles/snow-plow.webp',
    factZh: '铲雪车前面有大铲子，把积雪推到马路两边。',
    imageSource: { url: '', license: '', author: '' },
  },
];
```

- [ ] **Step 2: 更新 `src/data/vehicles/index.ts`**

```ts
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
```

- [ ] **Step 3: 创建 `src/data/completeness.test.ts`**

```ts
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
```

- [ ] **Step 4: 运行校验，确认失败（红）**

Run: `npm run validate`
Expected: **FAIL** —— 报应急车缺来源/图片，或 `completeness.test.ts` 报应急车未满足。

- [ ] **Step 5: 下载并优化 8 张应急车图片**

| id | 搜索关键词（Commons） |
|---|---|
| fire-truck | `fire engine` |
| ambulance | `ambulance` |
| police-car | `police car` |
| tow-truck | `tow truck` |
| rescue-helicopter | `rescue helicopter` |
| fire-boat | `fireboat` |
| patrol-boat | `patrol boat` |
| snow-plow | `snowplow` |

> 替补：`mountain rescue 山地救援车`、`lifeguard 救生艇 Lifeguard boat`。

- [ ] **Step 6: 运行校验，确认通过（绿）**

Run: `npm run validate`
Expected: **PASS**，全部测试通过，`vehicles.length === 48`。

- [ ] **Step 7: 以详细输出核对完整性测试**

Run: `npx vitest run src/data/completeness.test.ts --reporter=verbose`
Expected: 打印两条测试通过（6 大类全部有数据、每类 ≥8 条）。

- [ ] **Step 8: 提交**

```bash
git add src/data public/images/vehicles
git commit -m "feat: 应急车图鉴 8 条，6 大类 48 条内容完成"
```

---

## Task 9: 布局 + 首页

**Files:**
- Create: `src/layouts/Layout.astro`
- Create: `src/lib/navigation.ts`（先只含 `vehiclesInCategory`，Task 11 再补 `getNeighbors`）
- Modify: `src/pages/index.astro`（替换占位）

- [ ] **Step 1: 创建 `src/lib/navigation.ts`（先只放分类过滤）**

```ts
import type { Vehicle } from '../data/types';

export function vehiclesInCategory(vehicles: Vehicle[], category: string): Vehicle[] {
  return vehicles.filter((v) => v.category === category);
}
```

- [ ] **Step 2: 创建 `src/layouts/Layout.astro`**

```astro
---
interface Props {
  title: string;
  description?: string;
}
const {
  title,
  description = '给宝宝看的交通工具图鉴：真实照片，中英双语发音，点一点就发声。',
} = Astro.props;
const year = new Date().getFullYear();
---
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#fdfcf8" />
    <link rel="icon" href="/favicon.svg" />
    <title>{title}</title>
    <meta name="description" content={description} />
  </head>
  <body>
    <slot />
    <footer class="site-footer">
      <a href="/attribution">图片来源与致谢</a>
      <span>· 为爱小火车的你而做 · {year}</span>
    </footer>
  </body>
</html>

<style is:global>
  * { box-sizing: border-box; }
  :root { font-family: system-ui, -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif; }
  body { margin: 0; background: #fdfcf8; color: #333; }
  img { display: block; max-width: 100%; }
  .site-footer {
    text-align: center;
    font-size: 13px;
    color: #999;
    padding: 24px 16px 40px;
  }
  .site-footer a { color: #999; }
</style>
```

- [ ] **Step 3: 替换 `src/pages/index.astro`**

```astro
---
import Layout from '../layouts/Layout.astro';
import { categories } from '../data/categories';
import { vehicles } from '../data/vehicles';
import { vehiclesInCategory } from '../lib/navigation';
---
<Layout title="宝宝交通工具图鉴 🚂🚗✈️">
  <main class="home">
    <h1 class="logo">🚗 宝宝交通工具图鉴 ✈️</h1>
    <p class="subtitle">真实照片 · 中英双语 · 点一点听名字</p>
    <div class="grid">
      {categories.map((c) => (
        <a class="cat-card" href={`/category/${c.id}`}>
          <span class="emoji">{c.emoji}</span>
          <span class="name">{c.nameZh}</span>
          <span class="count">{vehiclesInCategory(vehicles, c.id).length} 种</span>
          <span class="en">{c.nameEn}</span>
        </a>
      ))}
    </div>
  </main>
</Layout>

<style>
  .home { max-width: 720px; margin: 0 auto; padding: 24px 16px 24px; text-align: center; }
  .logo { font-size: 26px; margin: 8px 0 4px; }
  .subtitle { color: #888; margin: 0 0 20px; font-size: 15px; }
  .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
  .cat-card {
    background: #fff;
    border-radius: 20px;
    padding: 22px 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    justify-content: center;
    text-decoration: none;
    color: inherit;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    min-height: 132px;
  }
  .cat-card:active { transform: scale(0.97); }
  .emoji { font-size: 46px; line-height: 1; }
  .name { font-size: 22px; font-weight: 700; }
  .count { font-size: 13px; color: #4a90d9; }
  .en { font-size: 12px; color: #aaa; }
  @media (min-width: 640px) {
    .grid { grid-template-columns: repeat(3, 1fr); }
  }
</style>
```

- [ ] **Step 4: 验证首页构建与渲染**

Run: `npm run build`
Expected: 退出码 0，生成 `dist/index.html`。

Run: `grep -c "cat-card" dist/index.html`
Expected: 输出 `6`。

- [ ] **Step 5: 类型检查**

Run: `npm run check`
Expected: 退出码 0，无错误。

- [ ] **Step 6: 提交**

```bash
git add src/layouts src/lib src/pages/index.astro
git commit -m "feat: 基础布局与首页 6 大类入口"
```

---

## Task 10: 分类页 + 卡片组件

**Files:**
- Create: `src/components/VehicleCard.astro`
- Create: `src/pages/category/[category].astro`

- [ ] **Step 1: 创建 `src/components/VehicleCard.astro`**

```astro
---
import type { Vehicle } from '../data/types';

interface Props {
  vehicle: Vehicle;
}
const { vehicle } = Astro.props;
---
<a class="card" href={`/vehicle/${vehicle.id}`}>
  <img
    src={vehicle.image}
    alt={`${vehicle.nameZh}（${vehicle.nameEn}）真实照片`}
    loading="lazy"
    width="1200"
    height="900"
  />
  <div class="names">
    <span class="zh">{vehicle.nameZh}</span>
    <span class="en">{vehicle.nameEn}</span>
  </div>
</a>

<style>
  .card {
    display: block;
    background: #fff;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    text-decoration: none;
    color: inherit;
  }
  .card:active { transform: scale(0.98); }
  .card img {
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
    background: #eee;
  }
  .names {
    padding: 10px 12px 12px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .zh { font-size: 20px; font-weight: 700; }
  .en { font-size: 13px; color: #888; }
</style>
```

- [ ] **Step 2: 创建 `src/pages/category/[category].astro`**

```astro
---
import Layout from '../../layouts/Layout.astro';
import VehicleCard from '../../components/VehicleCard.astro';
import { categories } from '../../data/categories';
import { vehicles } from '../../data/vehicles';
import { vehiclesInCategory } from '../../lib/navigation';

export function getStaticPaths() {
  return categories.map((c) => ({ params: { category: c.id } }));
}

const categoryId = Astro.params.category!;
const category = categories.find((c) => c.id === categoryId)!;
const list = vehiclesInCategory(vehicles, categoryId);
---
<Layout title={`${category.nameZh} ${category.emoji} · 宝宝交通工具图鉴`}>
  <main class="category">
    <header class="top">
      <a class="back" href="/">🏠 首页</a>
      <h1>{category.emoji} {category.nameZh}</h1>
      <span class="count">{list.length} 种</span>
    </header>
    <div class="grid">
      {list.map((v) => <VehicleCard vehicle={v} />)}
    </div>
  </main>
</Layout>

<style>
  .category { max-width: 860px; margin: 0 auto; padding: 12px 16px 24px; }
  .top {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 0 16px;
  }
  .top h1 { font-size: 22px; margin: 0; }
  .count { color: #999; font-size: 14px; }
  .back {
    text-decoration: none;
    color: #4a90d9;
    font-size: 16px;
    padding: 10px 12px;
    min-height: 48px;
    display: inline-flex;
    align-items: center;
  }
  .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
  @media (min-width: 640px) {
    .grid { grid-template-columns: repeat(3, 1fr); }
  }
</style>
```

- [ ] **Step 3: 构建并核对分类页数量**

Run: `npm run build`
Expected: 退出码 0。

Run: `ls dist/category/*.html | wc -l`
Expected: 输出 `6`。

Run: `grep -o 'href="/vehicle/[a-z-]*"' dist/category/trains.html | wc -l`
Expected: 输出 `8`（火车分类页有 8 个详情链接）。

- [ ] **Step 4: 提交**

```bash
git add src/components/VehicleCard.astro src/pages/category
git commit -m "feat: 分类页与车辆卡片组件"
```

---

## Task 11: 导航函数（TDD）+ 详情页静态版

**Files:**
- Modify: `src/lib/navigation.ts`
- Create: `src/lib/navigation.test.ts`
- Create: `src/pages/vehicle/[id].astro`

- [ ] **Step 1: 先写失败测试 `src/lib/navigation.test.ts`**

```ts
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
```

- [ ] **Step 2: 运行测试，确认失败（红）**

Run: `npx vitest run src/lib/navigation.test.ts`
Expected: **FAIL** —— `getNeighbors is not a function`（尚未实现）。

- [ ] **Step 3: 补全 `src/lib/navigation.ts`**

```ts
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
```

- [ ] **Step 4: 运行测试，确认通过（绿）**

Run: `npx vitest run src/lib/navigation.test.ts`
Expected: **PASS**，7 个测试通过。

- [ ] **Step 5: 创建详情页静态版 `src/pages/vehicle/[id].astro`**

> 本步骤先做**纯静态**版本（无发音、无连播），只预埋 JSON 数据挂载点 `<script type="application/json" id="autoplay-data">`；客户端交互脚本由 Task 13 追加。

```astro
---
import Layout from '../../layouts/Layout.astro';
import { categories } from '../../data/categories';
import { vehicles } from '../../data/vehicles';
import { getNeighbors, vehiclesInCategory } from '../../lib/navigation';

export function getStaticPaths() {
  return vehicles.map((v) => ({ params: { id: v.id } }));
}

const id = Astro.params.id!;
const vehicle = vehicles.find((v) => v.id === id)!;
const category = categories.find((c) => c.id === vehicle.category)!;
const list = vehiclesInCategory(vehicles, vehicle.category);
const index = list.findIndex((v) => v.id === vehicle.id);
const neighbors = getNeighbors(list, vehicle.id)!;

const autoplayData = list.map((v) => ({
  id: v.id,
  nameZh: v.nameZh,
  nameEn: v.nameEn,
  image: v.image,
  factZh: v.factZh,
  url: `/vehicle/${v.id}`,
}));
---
<Layout title={`${vehicle.nameZh} ${vehicle.nameEn} · 宝宝交通工具图鉴`}>
  <main class="detail">
    <header class="top">
      <a class="back" href={`/category/${category.id}`}>← {category.nameZh}</a>
      <span class="cat">{category.emoji}</span>
    </header>

    <figure class="photo">
      <img
        id="photo"
        src={vehicle.image}
        alt={`${vehicle.nameZh}（${vehicle.nameEn}）的真实照片`}
        width="1200"
        height="900"
      />
    </figure>

    <div class="names">
      <button id="speak-zh" class="speak" data-speak="zh">
        🔊 <span id="name-zh">{vehicle.nameZh}</span>
      </button>
      <button id="speak-en" class="speak" data-speak="en">
        <span id="name-en">{vehicle.nameEn}</span>
      </button>
    </div>

    <p class="fact" id="fact">{vehicle.factZh}</p>

    <div class="controls">
      <a id="prev" class="nav-btn" href={`/vehicle/${neighbors.prev.id}`}>⬅️ {neighbors.prev.nameZh}</a>
      <button id="autoplay-btn" class="play">▶️ 自动连播</button>
      <a id="next" class="nav-btn" href={`/vehicle/${neighbors.next.id}`}>{neighbors.next.nameZh} ➡️</a>
    </div>

    <script
      type="application/json"
      id="autoplay-data"
      set:html={JSON.stringify({ startIndex: index, vehicles: autoplayData })}
    ></script>
  </main>
</Layout>

<style>
  .detail { max-width: 720px; margin: 0 auto; padding: 8px 16px 32px; }
  .top { display: flex; justify-content: space-between; align-items: center; padding: 4px 0 10px; }
  .back {
    text-decoration: none;
    color: #4a90d9;
    font-size: 17px;
    padding: 10px 12px;
    min-height: 48px;
    display: inline-flex;
    align-items: center;
  }
  .cat { font-size: 28px; }
  .photo { margin: 0; }
  .photo img {
    width: 100%;
    height: min(52vh, 460px);
    object-fit: cover;
    border-radius: 20px;
    background: #eee;
  }
  .names {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: center;
    margin-top: 16px;
  }
  .speak {
    font-size: 26px;
    font-weight: 800;
    padding: 12px 20px;
    min-height: 56px;
    border: 3px solid #ffd166;
    border-radius: 999px;
    background: #fff;
    cursor: pointer;
  }
  #speak-en { font-size: 20px; color: #555; border-color: #a8c8f0; }
  button:disabled { opacity: 0.4; }
  .fact {
    font-size: 17px;
    line-height: 1.7;
    background: #fff8e6;
    border-radius: 14px;
    padding: 12px 16px;
    margin: 16px 0;
  }
  .controls {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 8px;
    align-items: center;
  }
  .nav-btn {
    text-align: center;
    font-size: 15px;
    font-weight: 700;
    background: #fff;
    border-radius: 999px;
    padding: 14px 8px;
    min-height: 52px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    color: #333;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .play {
    font-size: 15px;
    font-weight: 700;
    background: #4a90d9;
    color: #fff;
    border: none;
    border-radius: 999px;
    padding: 14px 14px;
    min-height: 52px;
    cursor: pointer;
    white-space: nowrap;
  }
</style>
```

- [ ] **Step 6: 构建并核对详情页数量与内容**

Run: `npm run build`
Expected: 退出码 0。

Run: `ls dist/vehicle/*.html | wc -l`
Expected: 输出 `48`。

Run: `grep -c "autoplay-data" dist/vehicle/steam-train.html`
Expected: 输出 `1`。

- [ ] **Step 7: 提交**

```bash
git add src/lib src/pages/vehicle
git commit -m "feat: 导航纯函数（TDD）与详情页静态版"
```

---

## Task 12: 发音模块（TDD）

**Files:**
- Create: `src/scripts/speak.ts`
- Create: `src/scripts/speak.test.ts`

- [ ] **Step 1: 先写失败测试 `src/scripts/speak.test.ts`**

> 只测纯函数 `pickVoice`（`speak()` 依赖 `window`，留待浏览器手动验证）。

```ts
import { describe, it, expect } from 'vitest';
import { pickVoice } from './speak';

describe('pickVoice', () => {
  it('精确匹配语言代码（兼容下划线与大小写）', () => {
    const voices = [
      { lang: 'en-US', name: 'Samantha' },
      { lang: 'zh_CN', name: 'Tingting' },
    ];
    expect(pickVoice(voices, 'zh-CN')?.name).toBe('Tingting');
  });

  it('无精确匹配时回退到语言前缀匹配', () => {
    const voices = [
      { lang: 'en-US', name: 'Samantha' },
      { lang: 'zh-HK', name: 'Sinji' },
    ];
    expect(pickVoice(voices, 'zh-CN')?.name).toBe('Sinji');
  });

  it('完全无匹配返回 undefined', () => {
    const voices = [{ lang: 'fr-FR', name: 'Thomas' }];
    expect(pickVoice(voices, 'zh-CN')).toBeUndefined();
  });

  it('空声音列表返回 undefined', () => {
    expect(pickVoice([], 'en-US')).toBeUndefined();
  });
});
```

- [ ] **Step 2: 运行测试，确认失败（红）**

Run: `npx vitest run src/scripts/speak.test.ts`
Expected: **FAIL** —— 找不到模块 `./speak`。

- [ ] **Step 3: 创建 `src/scripts/speak.ts`**

```ts
export interface SimpleVoice {
  lang: string;
  name: string;
}

/**
 * 从可用声音中挑选最匹配目标语言的。
 * 先精确匹配（兼容 zh_CN/zh-CN 与大小写），再退化为语言前缀匹配（zh-CN → zh）。
 */
export function pickVoice(voices: SimpleVoice[], lang: string): SimpleVoice | undefined {
  const normalized = lang.replace('_', '-').toLowerCase();
  const exact = voices.find((v) => v.lang.replace('_', '-').toLowerCase() === normalized);
  if (exact) return exact;
  const prefix = normalized.slice(0, 2);
  return voices.find((v) => v.lang.replace('_', '-').toLowerCase().startsWith(prefix));
}

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * 朗读文本。无论成功、结束还是出错都 resolve，避免调用链卡死。
 * 注意：iOS Safari 需要用户手势后语音才可用，见 unlockSpeech()。
 */
export function speak(text: string, lang: 'zh-CN' | 'en-US'): Promise<void> {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    // getVoices() 可能为空（voiceschanged 之前），此时仅设置 lang 由引擎自选
    const voice = pickVoice(synth.getVoices(), lang);
    if (voice) utterance.voice = voice;
    utterance.lang = lang;
    utterance.rate = 0.85; // 幼儿园跟读节奏
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    synth.speak(utterance);
  });
}

/**
 * iOS Safari 解锁：必须在一次用户手势的调用栈内触发一次语音，后续程序化语音才被允许。
 */
export function unlockSpeech(): void {
  if (!isSpeechSupported()) return;
  const utterance = new SpeechSynthesisUtterance('');
  utterance.volume = 0;
  window.speechSynthesis.speak(utterance);
}
```

- [ ] **Step 4: 运行测试，确认通过（绿）**

Run: `npx vitest run src/scripts/speak.test.ts`
Expected: **PASS**，4 个测试通过。

- [ ] **Step 5: 类型检查**

Run: `npm run check`
Expected: 退出码 0。

- [ ] **Step 6: 提交**

```bash
git add src/scripts/speak.ts src/scripts/speak.test.ts
git commit -m "feat: Web Speech API 封装与声音选择（TDD）"
```

---

## Task 13: 详情页接入发音 + 自动连播

**Files:**
- Create: `src/scripts/autoplay.ts`
- Modify: `src/pages/vehicle/[id].astro`（追加客户端脚本）

> 关键设计：**自动连播在页内循环**（`history.replaceState` 更新 URL，不整页跳转）。理由：① 无刷新闪烁，体验更流畅；② 避免 iOS 每次整页加载后 TTS 需要重新获取用户手势的问题；③ 图片可预加载下一张。

- [ ] **Step 1: 创建 `src/scripts/autoplay.ts`**

```ts
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface VehicleView {
  id: string;
  nameZh: string;
  nameEn: string;
  image: string;
  factZh: string;
  url: string;
}

export type SpeakFn = (text: string, lang: 'zh-CN' | 'en-US') => Promise<void>;

/**
 * 开始自动连播：从 startIndex 起循环整个列表。
 * 每辆：切内容 → 读中文 → 停顿 → 读英文 → 停顿 → 下一辆。
 * 返回 stop 函数；调用后循环在下一个 await 点退出。
 */
export function startAutoplay(
  views: VehicleView[],
  startIndex: number,
  apply: (view: VehicleView) => void,
  speakFn: SpeakFn,
  delays: { betweenLangs: number; afterVehicle: number } = {
    betweenLangs: 600,
    afterVehicle: 2000,
  },
): () => void {
  let stopped = false;

  void (async () => {
    for (let i = startIndex; !stopped; i = (i + 1) % views.length) {
      const view = views[i];
      apply(view);
      history.replaceState(null, '', view.url);

      const nextView = views[(i + 1) % views.length];
      const preload = new Image();
      preload.src = nextView.image;

      await speakFn(view.nameZh, 'zh-CN');
      if (stopped) break;
      await sleep(delays.betweenLangs);
      if (stopped) break;
      await speakFn(view.nameEn, 'en-US');
      if (stopped) break;
      await sleep(delays.afterVehicle);
    }
  })();

  return () => {
    stopped = true;
  };
}

/** 供视图切换时复用：由 id 在列表中定位上一个/下一个。 */
export function neighborViews(views: VehicleView[], id: string): { prev: VehicleView; next: VehicleView } {
  const index = views.findIndex((v) => v.id === id);
  const len = views.length;
  return {
    prev: views[(index - 1 + len) % len],
    next: views[(index + 1) % len],
  };
}
```

- [ ] **Step 2: 在 `src/pages/vehicle/[id].astro` 末尾追加客户端脚本**

把下面的 `<script>` 块**追加到文件末尾**（`</style>` 之后）：

```astro
<script>
  import type { VehicleView } from '../../scripts/autoplay';
  import { neighborViews, startAutoplay } from '../../scripts/autoplay';
  import { isSpeechSupported, speak, unlockSpeech } from '../../scripts/speak';

  const dataEl = document.getElementById('autoplay-data');
  if (dataEl) {
    const parsed = JSON.parse(dataEl.textContent ?? '{}') as {
      startIndex: number;
      vehicles: VehicleView[];
    };
    const views = parsed.vehicles;
    const supported = isSpeechSupported();

    const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
    const photo = $<HTMLImageElement>('photo');
    const nameZh = $<HTMLSpanElement>('name-zh');
    const nameEn = $<HTMLSpanElement>('name-en');
    const fact = $<HTMLParagraphElement>('fact');
    const prevLink = $<HTMLAnchorElement>('prev');
    const nextLink = $<HTMLAnchorElement>('next');
    const autoBtn = $<HTMLButtonElement>('autoplay-btn');

    const currentIndex = (): number => {
      const currentId = location.pathname.split('/').pop() ?? '';
      const i = views.findIndex((v) => v.id === currentId);
      return i === -1 ? 0 : i;
    };

    const apply = (view: VehicleView): void => {
      photo.src = view.image;
      photo.alt = `${view.nameZh}（${view.nameEn}）的真实照片`;
      nameZh.textContent = view.nameZh;
      nameEn.textContent = view.nameEn;
      fact.textContent = view.factZh;
      const { prev, next } = neighborViews(views, view.id);
      prevLink.href = prev.url;
      prevLink.textContent = `⬅️ ${prev.nameZh}`;
      nextLink.href = next.url;
      nextLink.textContent = `${next.nameZh} ➡️`;
    };

    let stop: (() => void) | null = null;
    let playing = false;

    const stopPlaying = (): void => {
      if (!playing) return;
      stop?.();
      stop = null;
      playing = false;
      autoBtn.textContent = '▶️ 自动连播';
    };

    // 发音按钮：点击中/英文名
    for (const { id, lang, text } of [
      { id: 'speak-zh', lang: 'zh-CN' as const, text: () => views[currentIndex()].nameZh },
      { id: 'speak-en', lang: 'en-US' as const, text: () => views[currentIndex()].nameEn },
    ]) {
      const btn = $<HTMLButtonElement>(id);
      if (!supported) {
        btn.disabled = true;
        btn.title = '当前浏览器不支持语音';
        continue;
      }
      btn.addEventListener('click', () => {
        stopPlaying();
        unlockSpeech();
        void speak(text(), lang);
      });
    }

    // 连播按钮
    if (!supported) {
      autoBtn.remove();
    } else {
      autoBtn.addEventListener('click', () => {
        if (playing) {
          stopPlaying();
          return;
        }
        unlockSpeech();
        playing = true;
        autoBtn.textContent = '⏸️ 停止连播';
        stop = startAutoplay(views, currentIndex(), apply, speak);
      });
    }

    // 任何点击（连播按钮自身除外）都退出连播——误触友好
    document.addEventListener(
      'click',
      (event) => {
        if ((event.target as HTMLElement).closest('#autoplay-btn')) return;
        stopPlaying();
      },
      true,
    );
  }
</script>
```

- [ ] **Step 3: 类型检查**

Run: `npm run check`
Expected: 退出码 0，无类型错误。

- [ ] **Step 4: 构建验证**

Run: `npm run build`
Expected: 退出码 0，`ls dist/vehicle/*.html | wc -l` 输出 `48`。

- [ ] **Step 5: 浏览器手动验证（桌面 Chrome）**

Run: `npm run preview`，然后浏览器打开 `http://localhost:4321/vehicle/steam-train`

逐项确认：
1. 点击「🔊 蒸汽火车」→ 听到中文发音
2. 点击「Steam Train」→ 听到英文发音
3. 点击「▶️ 自动连播」→ 按钮变「⏸️ 停止连播」，页面自动读「蒸汽火车 / Steam Train」并切到下一辆
4. 连播过程中点击页面任意处 → 停止连播，按钮复原
5. 点击「下一辆」→ 整页跳转到下一辆详情页（URL 变化）
6. 连播过程中浏览器地址栏 URL 会随之变化（replaceState 生效），无整页刷新

Expected: 6 项全部通过。

- [ ] **Step 6: 提交**

```bash
git add src/scripts/autoplay.ts src/pages/vehicle
git commit -m "feat: 详情页发音与页内自动连播"
```

---

## Task 14: 图片来源页

**Files:**
- Create: `src/pages/attribution.astro`

- [ ] **Step 1: 创建 `src/pages/attribution.astro`**

```astro
---
import Layout from '../layouts/Layout.astro';
import { categories } from '../data/categories';
import { vehicles } from '../data/vehicles';
---
<Layout title="图片来源与致谢 · 宝宝交通工具图鉴">
  <main class="attr">
    <a class="back" href="/">🏠 首页</a>
    <h1>图片来源与致谢</h1>
    <p class="note">
      本站照片来自 Wikimedia Commons、Unsplash 等可免费使用的图库，遵循各自许可协议：
    </p>
    {categories.map((c) => (
      <section>
        <h2>{c.emoji} {c.nameZh}</h2>
        <ul>
          {vehicles
            .filter((v) => v.category === c.id)
            .map((v) => (
              <li>
                <strong>{v.nameZh}</strong> · 作者：{v.imageSource.author || '未注明'} ·
                <a href={v.imageSource.url} target="_blank" rel="noopener noreferrer">
                  来源页
                </a>
                · {v.imageSource.license}
              </li>
            ))}
        </ul>
      </section>
    ))}
  </main>
</Layout>

<style>
  .attr { max-width: 720px; margin: 0 auto; padding: 8px 16px 32px; font-size: 15px; }
  .back {
    text-decoration: none;
    color: #4a90d9;
    padding: 10px 12px;
    display: inline-flex;
    min-height: 48px;
    align-items: center;
  }
  h1 { font-size: 24px; }
  h2 { font-size: 18px; margin-top: 24px; }
  .note { color: #777; }
  ul { padding-left: 20px; line-height: 1.9; }
  a { color: #4a90d9; }
</style>
```

- [ ] **Step 2: 构建并核对**

Run: `npm run build`
Expected: 退出码 0，生成 `dist/attribution/index.html`。

Run: `grep -c "来源页" dist/attribution/index.html`
Expected: 输出 `48`（每个条目一条来源记录）。

- [ ] **Step 3: 提交**

```bash
git add src/pages/attribution.astro
git commit -m "feat: 图片来源与致谢页"
```

---

## Task 15: 构建与性能验收

**Files:** 无新增（纯验证任务；发现问题则修复后再提交）

- [ ] **Step 1: 全量测试**

Run: `npm test`
Expected: 全部 PASS（validate + completeness + navigation + speak）。

- [ ] **Step 2: 全量构建 + 类型检查**

Run: `npm run check && npm run build`
Expected: 两条命令退出码均为 0。

- [ ] **Step 3: 核对生成页面数量**

```bash
ls dist/vehicle/*.html | wc -l    # 预期 48
ls dist/category/*.html | wc -l   # 预期 6
ls dist/index.html dist/attribution/index.html  # 预期两者都存在
```

- [ ] **Step 4: Lighthouse 移动端性能检查**

```bash
npx --yes serve dist -l 4321 &
npx --yes lighthouse http://localhost:4321/ --only-categories=performance --output=json --output-path=/tmp/lh.json --chrome-flags="--headless"
node -e "const r=require('/tmp/lh.json');console.log('Performance:',Math.round(r.categories.performance.score*100))"
```
Expected: 打印 `Performance: 90` 或更高（≥90 达标）。Lighthouse 默认按移动端仿真与 4G 限速运行。

> 若 <90：优先检查详情页图片是否过大（应 ≤300KB）、是否开启了懒加载。分类页/首页应无大图。

- [ ] **Step 5: 手机竖屏（375px）验收**

浏览器 DevTools 切换到 iPhone SE（375×667），逐项确认：
1. 首页、分类页、详情页均无横向滚动条
2. 首页 6 个大卡片可点，尺寸 ≥48px
3. 分类页卡片两列排布，图片不溢出
4. 详情页大图、中英文名、「自动连播」按钮均在一屏可视/易点击范围内
5. 「上一辆 / 自动连播 / 下一辆」三按钮单手可及，不换行错位

Expected: 5 项全部通过。

- [ ] **Step 6: iOS Safari 真机验收（条件允许）**

在 iPhone/iPad 上访问预览地址（可用 `npx serve dist` + 局域网 IP，或部署后用线上地址）：
1. 点「🔊 蒸汽火车」→ 有中文发音（首次点击是解锁点）
2. 点「Steam Train」→ 有英文发音
3. 点「▶️ 自动连播」→ 连续朗读并自动切换，无需再次点击
4. 点页面任意处 → 停止连播
5. 全程无弹窗、无卡死

Expected: 5 项全部通过。若第 3 项失败（iOS 阻断程序化语音），记录现象并参考下方预案。

> **iOS 预案**：若连播在 iOS 上被静默阻断，在 `startAutoplay` 每次 `speakFn` 前加入一次 `unlockSpeech()`（它本身是静默 utterance，不产生声音），通常可维持会话内合成权限。若仍失败，退化为「每次切换后按钮闪现提示需轻触」——但先实测再决定，避免过度设计。

- [ ] **Step 7: 需求验收清单核对**

逐条对照 `docs/requirements.md` §8 十条验收标准打勾。全部满足后提交（如有修复）：

```bash
git add -A
git commit -m "test: 构建、性能与移动端验收通过"
```

---

## Task 16: 部署上线

**Files:**
- Create: `.github/workflows/deploy.yml`（仅当选择 GitHub Pages 时）

> 首选 Vercel：零配置识别 Astro、自动 HTTPS、推送即部署、免费额度充足。以下以 Vercel 为主，另附备选。

- [ ] **Step 1: 用 Vercel 部署（推荐）**

```bash
npx vercel login
npx vercel --prod
```
首次运行按提示操作：确认项目名（如 `baby-toys`）→ Framework 自动识别为 Astro → Build Command `npm run build` → Output Directory `dist`。
Expected: 命令结束打印 `Production: https://<项目名>.vercel.app`。

- [ ] **Step 2: 更新 `astro.config.mjs` 的 site 为真实域名**

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://<你的项目名>.vercel.app',
});
```

Run: `npm run build`
Expected: 退出码 0。

```bash
git add astro.config.mjs
git commit -m "chore: 更新 site 为线上域名"
```

- [ ] **Step 3: 把线上地址发给家人测试**

在手机浏览器打开线上 URL，重复 Task 15 Step 5/6 的核心检查项（发音、连播、竖屏布局）。
Expected: 线上表现与本地一致。

- [ ] **Step 4（备选 A）: Netlify 部署**

```bash
npx netlify-cli deploy --build --prod
```
按提示确认 build command `npm run build`、publish directory `dist`。

- [ ] **Step 5（备选 B）: GitHub Pages 部署**

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

> 若使用 GitHub Pages 且部署在子路径（`https://<用户>.github.io/baby-toys/`），需在 `astro.config.mjs` 设置 `base: '/baby-toys'` 并同步调整图片/链接路径。推荐用自定义域名或 Vercel 规避此复杂度。

- [ ] **Step 6: 提交部署配置（若创建了 workflow）**

```bash
git add .github
git commit -m "ci: 添加 GitHub Pages 部署工作流"
```

---

## 风险与预案

| 风险 | 影响 | 预案 |
|---|---|---|
| iOS Safari 阻断程序化 TTS | 自动连播在 iOS 上可能只读第一辆 | 页内连播（已采用）避免整页重载；仍失败时在每次 speak 前补 `unlockSpeech()`（Task 15 Step 6 预案） |
| 某条目找不到合规照片 | 该类不足 8 条，校验失败 | 每个类别任务都列了替补条目；实在找不到可替换为同类近似条目，保持 ≥8 |
| 许可协议判断失误 | 版权风险 | 校验测试限定许可白名单（CC BY/CC BY-SA/CC0/PD/Unsplash/Pexels）；公开传播前逐图复核 `attribution` 页 |
| 图片压缩后仍 >300KB | 校验失败、加载慢 | 优化脚本自动降质量至 40；仍超标则更换主体更简洁的照片 |
| Lighthouse < 90 | 不达验收标准 | 检查图片体积与懒加载；必要时对详情页大图改用 `width=800` 版本 |
| 内容（小知识）文字不适合幼儿 | 体验打折 | 全部小知识为 ≤60 字短句、口语化，已内联在数据文件中，可随时改文案后重新构建 |

## 执行建议

- **Task 3-8 是内容密集型任务**（找图 + 版权核对 + 压缩），最耗时且彼此独立，建议用 subagent-driven-development 并行分发（每个类别一个 subagent），完成后统一验证 `npm run validate`。
- **Task 11-13 是逻辑密集型任务**，包含 TDD 与浏览器实测，建议串行执行并逐个 review。
- 每个 Task 结束都是一个可提交、可构建的绿色状态——随时可以停下来，网站仍可用。
