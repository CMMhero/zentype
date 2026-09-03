/** Tiny WebAudio keystroke feedback — no assets needed. */
let ctx: AudioContext | null = null;

function audioCtx(): AudioContext | null {
  try {
    if (!ctx) {
      const AC =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function blip(
  freq: number,
  durationMs: number,
  volume: number,
  type: OscillatorType = "square",
  decay = true,
) {
  const ac = audioCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t = ac.currentTime;
  const vol = Math.max(0.0001, volume);
  gain.gain.setValueAtTime(vol, t);
  if (decay) {
    gain.gain.exponentialRampToValueAtTime(0.0001, t + durationMs / 1000);
  }
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + durationMs / 1000);
}

export function playKeypress(variant: "click" | "thock" | "beep", volume: number) {
  switch (variant) {
    case "thock":
      blip(150 + Math.random() * 40, 45, volume * 0.5, "triangle");
      break;
    case "beep":
      blip(880, 35, volume * 0.25, "sine");
      break;
    default:
      blip(700 + Math.random() * 300, 18, volume * 0.3, "square");
  }
}

export function playError(volume: number) {
  blip(140, 120, volume * 0.5, "sawtooth");
}
