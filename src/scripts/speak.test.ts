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
