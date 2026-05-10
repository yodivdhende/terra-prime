function createEffectsService() {
  let crt = $state(false);
  let scanlines = $state(true);
  let vignette = $state(false);

  return {
    get crt() { return crt; },
    set crt(v) { crt = v; },
    get scanlines() { return scanlines; },
    set scanlines(v) { scanlines = v; },
    get vignette() { return vignette; },
    set vignette(v) { vignette = v; },
  };
}

export const EFFECTS_SERVICE = createEffectsService();
