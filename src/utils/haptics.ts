export const haptics = {
  vibrate(pattern: number | number[], enabled = true) {
    if (!enabled) return;
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {
      // Ignore vibration errors on unsupporting browsers
    }
  },

  tap(enabled = true) {
    this.vibrate(15, enabled);
  },

  nitro(enabled = true) {
    this.vibrate([30, 40, 60], enabled);
  },

  nearMiss(enabled = true) {
    this.vibrate([20, 30, 40], enabled);
  },

  collision(enabled = true) {
    this.vibrate([80, 50, 120, 60, 200], enabled);
  },
};
