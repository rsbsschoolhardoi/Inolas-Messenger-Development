/**
 * Zenoa Audio Recording & Playback Engine
 * Handles high-fidelity voice recording, cross-browser audio format conversion,
 * waveform extraction, and seamless audio playback.
 */

// Generate a clean sine/melodic audio buffer if microphone unavailable or test
export function generateSyntheticVoiceNote(durationSeconds = 3): string {
  const sampleRate = 44100;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF identifier 'RIFF'
  writeString(view, 0, 'RIFF');
  // file length
  view.setUint32(4, 36 + dataSize, true);
  // RIFF type 'WAVE'
  writeString(view, 8, 'WAVE');
  // format chunk identifier 'fmt '
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw PCM)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate
  view.setUint32(28, byteRate, true);
  // block align
  view.setUint16(32, blockAlign, true);
  // bits per sample
  view.setUint16(34, bitsPerSample, true);
  // data chunk identifier 'data'
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, dataSize, true);

  // Write friendly human voice frequency harmonic tones (approx 220Hz - 440Hz vocal formant simulation)
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Harmonic frequencies for vocal warm tone
    const f1 = 280 + Math.sin(t * 4) * 30;
    const f2 = 560 + Math.sin(t * 3) * 40;
    const envelope = Math.min(1, Math.min(t * 5, (durationSeconds - t) * 5)); // smooth attack and decay
    const sample = (Math.sin(2 * Math.PI * f1 * t) * 0.6 + Math.sin(2 * Math.PI * f2 * t) * 0.3) * envelope * 0.8;
    const clamped = Math.max(-1, Math.min(1, sample));
    const intSample = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
    view.setInt16(offset, intSample, true);
    offset += 2;
  }

  const blob = new Blob([view], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Converts an audio Blob into a Base64 string for persistent cloud & E2EE transmission.
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Gets best supported audio recorder MIME type
 */
export function getSupportedMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return 'audio/webm';
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
    'audio/aac'
  ];
  for (const t of types) {
    if (MediaRecorder.isTypeSupported(t)) {
      return t;
    }
  }
  return '';
}
