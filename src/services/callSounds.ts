/**
 * Call Sound Manager — Web Audio API
 *
 * Generates ringtones programmatically, no external audio files needed.
 * - Outgoing tone: short repeating "beep... beep..." (like Zalo/Messenger)
 * - Incoming ringtone: classic phone ring pattern (like Zalo incoming)
 *
 * IMPORTANT: This module is ADDITIVE — it does NOT modify any call logic.
 */

class CallSoundManager {
  private audioContext: AudioContext | null = null;
  private outgoingInterval: number | null = null;
  private incomingInterval: number | null = null;
  private activeOscillators: OscillatorNode[] = [];
  private activeGains: GainNode[] = [];
  private isPlayingOutgoing = false;
  private isPlayingIncoming = false;

  private getContext(): AudioContext {
    if (!this.audioContext || this.audioContext.state === 'closed') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
    return this.audioContext;
  }

  // ── Outgoing call tone (caller side) ──
  // Pattern: "beep" 400Hz for 300ms, pause 1700ms, repeat
  // Similar to: Messenger/WhatsApp outgoing ring
  playOutgoingTone() {
    if (this.isPlayingOutgoing) return;
    this.isPlayingOutgoing = true;

    const playBeep = () => {
      try {
        const ctx = this.getContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime); // A4 note

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02);   // fade in
        gain.gain.setValueAtTime(0.15, ctx.currentTime + 0.28);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.35);      // fade out

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);

        this.activeOscillators.push(osc);
        this.activeGains.push(gain);

        osc.onended = () => {
          this.activeOscillators = this.activeOscillators.filter(o => o !== osc);
          this.activeGains = this.activeGains.filter(g => g !== gain);
        };
      } catch (e) {
        console.warn('CallSounds: Failed to play outgoing beep', e);
      }
    };

    playBeep();
    this.outgoingInterval = window.setInterval(playBeep, 2000);
  }

  // ── Incoming call ringtone (receiver side) ──
  // Pattern: two-tone ring (440Hz + 480Hz) for 500ms, pause 250ms, ring again 500ms, pause 2000ms
  // Similar to: Classic phone ring / Zalo incoming
  playIncomingRingtone() {
    if (this.isPlayingIncoming) return;
    this.isPlayingIncoming = true;

    const playRingBurst = () => {
      try {
        const ctx = this.getContext();

        const playTone = (startOffset: number, duration: number) => {
          // Tone 1: 440Hz
          const osc1 = ctx.createOscillator();
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(440, ctx.currentTime);

          // Tone 2: 480Hz (creates a "ringing" beat)
          const osc2 = ctx.createOscillator();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(480, ctx.currentTime);

          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0, ctx.currentTime + startOffset);
          gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + startOffset + 0.02);
          gain.gain.setValueAtTime(0.12, ctx.currentTime + startOffset + duration - 0.02);
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + startOffset + duration);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc1.start(ctx.currentTime + startOffset);
          osc1.stop(ctx.currentTime + startOffset + duration);
          osc2.start(ctx.currentTime + startOffset);
          osc2.stop(ctx.currentTime + startOffset + duration);

          this.activeOscillators.push(osc1, osc2);
          this.activeGains.push(gain);

          const cleanup = (osc: OscillatorNode) => {
            osc.onended = () => {
              this.activeOscillators = this.activeOscillators.filter(o => o !== osc);
            };
          };
          cleanup(osc1);
          cleanup(osc2);
        };

        // Ring 1: 0 - 0.5s
        playTone(0, 0.5);
        // Ring 2: 0.75 - 1.25s
        playTone(0.75, 0.5);
      } catch (e) {
        console.warn('CallSounds: Failed to play incoming ring', e);
      }
    };

    playRingBurst();
    this.incomingInterval = window.setInterval(playRingBurst, 3000);
  }

  // ── Stop outgoing tone ──
  stopOutgoingTone() {
    if (this.outgoingInterval) {
      window.clearInterval(this.outgoingInterval);
      this.outgoingInterval = null;
    }
    this.isPlayingOutgoing = false;
    this.cleanupOscillators();
  }

  // ── Stop incoming ringtone ──
  stopIncomingRingtone() {
    if (this.incomingInterval) {
      window.clearInterval(this.incomingInterval);
      this.incomingInterval = null;
    }
    this.isPlayingIncoming = false;
    this.cleanupOscillators();
  }

  // ── Stop ALL sounds ──
  stopAll() {
    this.stopOutgoingTone();
    this.stopIncomingRingtone();
  }

  private cleanupOscillators() {
    for (const osc of this.activeOscillators) {
      try { osc.stop(); } catch { /* already stopped */ }
    }
    for (const gain of this.activeGains) {
      try { gain.disconnect(); } catch { /* already disconnected */ }
    }
    this.activeOscillators = [];
    this.activeGains = [];
  }
}

export const callSounds = new CallSoundManager();
