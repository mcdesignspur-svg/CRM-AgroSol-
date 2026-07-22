export type AlertSoundVariant = "urgent" | "ready" | "info";

let audioContext: AudioContext | null = null;
let unlocked = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }

  if (!audioContext) {
    const Ctx =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) {
      return null;
    }
    audioContext = new Ctx();
  }

  return audioContext;
}

export function unlockAlertSounds() {
  const ctx = getAudioContext();
  if (!ctx || unlocked) {
    return;
  }

  void ctx.resume();
  unlocked = true;
}

export function areAlertSoundsUnlocked() {
  return unlocked;
}

export function playAlertSound(variant: AlertSoundVariant = "urgent") {
  const ctx = getAudioContext();
  if (!ctx || !unlocked) {
    return;
  }

  const now = ctx.currentTime;
  const tones =
    variant === "urgent"
      ? [
          { frequency: 880, start: 0, duration: 0.12 },
          { frequency: 660, start: 0.14, duration: 0.16 },
        ]
      : variant === "ready"
        ? [{ frequency: 740, start: 0, duration: 0.2 }]
        : [{ frequency: 620, start: 0, duration: 0.1 }];

  for (const tone of tones) {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = tone.frequency;
    gain.gain.value = 0.0001;

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    const startAt = now + tone.start;
    const endAt = startAt + tone.duration;

    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(0.08, startAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, endAt);

    oscillator.start(startAt);
    oscillator.stop(endAt + 0.02);
  }
}
