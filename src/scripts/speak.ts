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
