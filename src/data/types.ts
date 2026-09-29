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
