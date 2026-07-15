/**
 * Tiny procedural sound effects, synthesized via the Web Audio API rather
 * than loaded from files — there's nothing to fetch or ship.
 */
export class SoundEffects {
  private readonly context = new AudioContext();
  private noiseBuffer: AudioBuffer | null = null;

  /** A fast, airy wind-swish for when a punch is thrown. */
  playWhoosh(): void {
    this.resumeIfNeeded();
    const now = this.context.currentTime;
    const duration = 0.16;

    const noise = this.context.createBufferSource();
    noise.buffer = this.getNoiseBuffer();

    // A tighter, higher-Q sweep across a wide range reads as a whistling
    // rush of air, rather than the duller, broader hiss a low-Q sweep gives.
    const filter = this.context.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 2.5;
    filter.frequency.setValueAtTime(3400, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + duration);

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.4, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.context.destination);

    noise.start(now);
    noise.stop(now + duration);
  }

  /** A percussive thump + crack for when a punch actually connects. */
  playHit(): void {
    this.resumeIfNeeded();
    const now = this.context.currentTime;

    // Low-pitched "thud" body — a kick-drum-style fast pitch drop, not a
    // sustained musical tone, so it reads as an impact rather than a note.
    const thud = this.context.createOscillator();
    thud.type = "sine";
    thud.frequency.setValueAtTime(170, now);
    thud.frequency.exponentialRampToValueAtTime(45, now + 0.07);

    const thudGain = this.context.createGain();
    thudGain.gain.setValueAtTime(0.55, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    thud.connect(thudGain);
    thudGain.connect(this.context.destination);
    thud.start(now);
    thud.stop(now + 0.09);

    // Sharp, brief high-passed noise "crack" for the initial impact transient.
    const crack = this.context.createBufferSource();
    crack.buffer = this.getNoiseBuffer();

    const crackFilter = this.context.createBiquadFilter();
    crackFilter.type = "highpass";
    crackFilter.frequency.value = 900;

    const crackGain = this.context.createGain();
    crackGain.gain.setValueAtTime(0.4, now);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    crack.connect(crackFilter);
    crackFilter.connect(crackGain);
    crackGain.connect(this.context.destination);
    crack.start(now);
    crack.stop(now + 0.025);
  }

  /** A cartoon spring "boing" for when the player jumps. */
  playBoing(): void {
    this.resumeIfNeeded();
    const now = this.context.currentTime;
    const duration = 0.45;
    const launchDuration = 0.07;

    // The pitch launches upward quickly, then a decaying vibrato (an LFO
    // frequency-modulating the carrier) makes it wobble and settle — the
    // classic "boi-oi-oing" spring shape.
    const carrier = this.context.createOscillator();
    carrier.type = "sine";
    carrier.frequency.setValueAtTime(180, now);
    carrier.frequency.exponentialRampToValueAtTime(420, now + launchDuration);

    const lfo = this.context.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 24;

    const lfoDepth = this.context.createGain();
    lfoDepth.gain.setValueAtTime(90, now + launchDuration);
    lfoDepth.gain.exponentialRampToValueAtTime(1, now + duration);

    lfo.connect(lfoDepth);
    lfoDepth.connect(carrier.frequency);

    const ampGain = this.context.createGain();
    ampGain.gain.setValueAtTime(0.0001, now);
    ampGain.gain.exponentialRampToValueAtTime(0.4, now + 0.04);
    ampGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    carrier.connect(ampGain);
    ampGain.connect(this.context.destination);

    carrier.start(now);
    lfo.start(now);
    carrier.stop(now + duration);
    lfo.stop(now + duration);
  }

  private getNoiseBuffer(): AudioBuffer {
    if (this.noiseBuffer) return this.noiseBuffer;
    const duration = 0.5;
    const buffer = this.context.createBuffer(1, duration * this.context.sampleRate, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
    return buffer;
  }

  /** Browsers start AudioContext suspended until a user gesture unlocks it. */
  private resumeIfNeeded(): void {
    if (this.context.state === "suspended") {
      this.context.resume().catch(() => {});
    }
  }
}
