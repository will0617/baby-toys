import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { pickVoice, speak } from './speak';

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

  it('跳过系统搞怪/古董声音（如 Albert），选正常声音', () => {
    const voices = [
      { lang: 'en-US', name: 'Albert' },
      { lang: 'en-US', name: 'Samantha' },
    ];
    expect(pickVoice(voices, 'en-US')?.name).toBe('Samantha');
  });

  it('优先已知高质量声音（Google 网络语音 > 其他正常声音）', () => {
    const voices = [
      { lang: 'en-US', name: 'Samantha' },
      { lang: 'en-US', name: 'Google US English' },
    ];
    expect(pickVoice(voices, 'en-US')?.name).toBe('Google US English');
  });

  it('候选全部是搞怪声音时返回第一个（保证仍能发声）', () => {
    const voices = [
      { lang: 'en-US', name: 'Albert' },
      { lang: 'en-US', name: 'Bells' },
    ];
    expect(pickVoice(voices, 'en-US')?.name).toBe('Albert');
  });
});

class FakeUtterance {
  text: string;
  voice?: { name: string };
  lang = '';
  rate = 1;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(text: string) {
    this.text = text;
  }
}

function makeFakeSynth(initialVoices: Array<{ lang: string; name: string }>) {
  let voices = initialVoices;
  const listeners: Array<() => void> = [];
  const spoken: FakeUtterance[] = [];
  return {
    spoken,
    setVoices: (v: Array<{ lang: string; name: string }>) => {
      voices = v;
      for (const fn of listeners.splice(0)) fn();
    },
    speechSynthesis: {
      getVoices: () => voices,
      addEventListener: (_event: string, callback: () => void) => {
        listeners.push(callback);
      },
      speak: (utterance: FakeUtterance) => {
        spoken.push(utterance);
        utterance.onend?.();
      },
    },
  };
}

describe('speak（声音列表异步就绪）', () => {
  beforeEach(() => {
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('首次点击时声音列表为空 → 等 voiceschanged 就绪后仍选中 Google 声音', async () => {
    const fake = makeFakeSynth([]);
    vi.stubGlobal('window', { speechSynthesis: fake.speechSynthesis });

    const pending = speak('Steam Train', 'en-US');
    fake.setVoices([
      { lang: 'en-US', name: 'Albert' },
      { lang: 'en-US', name: 'Google US English' },
    ]);
    await pending;

    expect(fake.spoken).toHaveLength(1);
    expect(fake.spoken[0].voice?.name).toBe('Google US English');
  });

  it('超时仍未就绪 → 不带 voice 朗读（lang 兜底，保证能出声）', async () => {
    vi.useFakeTimers();
    try {
      const fake = makeFakeSynth([]);
      vi.stubGlobal('window', { speechSynthesis: fake.speechSynthesis });

      const pending = speak('Steam Train', 'en-US');
      const flushed = vi.advanceTimersByTimeAsync(1000);
      await Promise.all([pending, flushed]);

      expect(fake.spoken).toHaveLength(1);
      expect(fake.spoken[0].voice).toBeUndefined();
      expect(fake.spoken[0].lang).toBe('en-US');
    } finally {
      vi.useRealTimers();
    }
  });

  it('声音列表已就绪 → 立即朗读，无需等待事件', async () => {
    const fake = makeFakeSynth([{ lang: 'en-US', name: 'Google US English' }]);
    vi.stubGlobal('window', { speechSynthesis: fake.speechSynthesis });

    await speak('Steam Train', 'en-US');

    expect(fake.spoken).toHaveLength(1);
    expect(fake.spoken[0].voice?.name).toBe('Google US English');
  });
});
