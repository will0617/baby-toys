export interface SimpleVoice {
  lang: string;
  name: string;
}

/**
 * macOS/Chrome 暴露的"搞怪/古董"系统声音（Albert、Bad News、Bells 等），
 * 发音沙哑失真，绝不能让幼儿跟读。按名字子串排除。
 */
const NOVELTY_VOICE =
  /(albert|bad news|good news|bahh|bells|boing|bubbles|cellos|deranged|hysterical|junior|organ|pipes|ralph|trinoids|princess|wobble|jester|superstar|zarvox|whisper|grandma|grandpa|fred|flo|sandy|eddy|reed|rocko|shelley)/i;

/** 已知高质量声音：Chrome 的 Google 网络语音、macOS/Edge 的自然人声。 */
const PREFERRED_VOICE =
  /(google|samantha|aria|ava|jenny|zira|guy|libby|sonia|natasha|serena|daniel|karen|moira|tessa|allison|nicky)/i;

/**
 * 从可用声音中挑选最匹配目标语言的。
 * 匹配顺序：精确语言代码（兼容 zh_CN/zh-CN 与大小写）→ 语言前缀（zh-CN → zh）。
 * 质量排序：已知高质量声音 > 非搞怪声音 > 搞怪声音（保底，确保仍能发声）。
 */
export function pickVoice<T extends SimpleVoice>(voices: T[], lang: string): T | undefined {
  const normalized = lang.replace('_', '-').toLowerCase();
  const langOf = (v: SimpleVoice) => v.lang.replace('_', '-').toLowerCase();

  const exact = voices.filter((v) => langOf(v) === normalized);
  const pool =
    exact.length > 0 ? exact : voices.filter((v) => langOf(v).startsWith(normalized.slice(0, 2)));
  if (pool.length === 0) return undefined;

  const preferred =
    pool.find((v) => /google/i.test(v.name)) ??
    pool.find((v) => PREFERRED_VOICE.test(v.name));
  if (preferred) return preferred;

  const normal = pool.find((v) => !NOVELTY_VOICE.test(v.name));
  return normal ?? pool[0];
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
    const voice = pickVoice(synth.getVoices(), lang);
    if (voice) utterance.voice = voice;
    utterance.lang = lang;
    utterance.rate = 0.85;
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
