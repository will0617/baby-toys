export interface VehicleView {
  id: string;
  nameZh: string;
  nameEn: string;
  image: string;
  factZh: string;
  url: string;
}

export type SpeakFn = (text: string, lang: 'zh-CN' | 'en-US') => Promise<void>;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

/** 由 id 在列表中定位上一个/下一个（环绕）。 */
export function neighborViews(views: VehicleView[], id: string): { prev: VehicleView; next: VehicleView } {
  const index = views.findIndex((v) => v.id === id);
  const len = views.length;
  return {
    prev: views[(index - 1 + len) % len],
    next: views[(index + 1) % len],
  };
}
