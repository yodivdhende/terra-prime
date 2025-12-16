import { getContext, onDestroy, setContext } from "svelte";

class PromoAnimationManager {
  public static CONTEXT_KEY = Symbol('PROMO_ANIMATION_MANAGER_CONTEXT_KEY');
  private animations: ((reverse: boolean) => void)[] = [];
  private nextAnimationIndex: number = 0;
  private timeouts: NodeJS.Timeout[] = [];

  constructor() {
    setInterval(() => {
      const animation = this.animations[this.nextAnimationIndex];
      if (animation == null) return;
      animation(false);
      this.timeouts.push(
        setTimeout(() => {
          animation(true);
          this.nextAnimationIndex = (this.nextAnimationIndex + 1) % this.animations.length;
        }, 4000)
      );
    }, 2 * 60 * 1000);

    onDestroy(() => {
      this.timeouts.forEach(timeout => clearTimeout(timeout));
    })
  }

  public registerAnimation({ animation }: { animation: (reverse: boolean) => void }) {
    this.animations.push(animation)
  }

}

export function setPromoAnimationManagerContext() {
  return setContext(PromoAnimationManager.CONTEXT_KEY, new PromoAnimationManager());
}

export function getPromoAnimationManagerContext() {
  return getContext<PromoAnimationManager>(PromoAnimationManager.CONTEXT_KEY);
}

