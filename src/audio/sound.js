let audioContext = null;
let masterGain = null;
const activeSounds = new Map();
const lastPlayedAt = new Map();

const SOUND_COOLDOWN_MS = 28;

function getAudioContext(){
  if(typeof window === "undefined") return null;

  const AudioContext = window.AudioContext ?? window.webkitAudioContext;
  if(!AudioContext) return null;

  if(!audioContext){
    audioContext = new AudioContext();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.6;
    masterGain.connect(audioContext.destination);
  }

  if(audioContext.state === "suspended"){
    void audioContext.resume();
  }

  return audioContext;
}

function tone(context, destination, {frequency, endFrequency = frequency, delay = 0, duration, volume, type = "sine"}){
  const startsAt = context.currentTime + delay;
  const endsAt = startsAt + duration;
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startsAt);
  oscillator.frequency.exponentialRampToValueAtTime(endFrequency, endsAt);
  gain.gain.setValueAtTime(0.0001, startsAt);
  gain.gain.exponentialRampToValueAtTime(volume, startsAt + Math.min(0.008, duration / 3));
  gain.gain.exponentialRampToValueAtTime(0.0001, endsAt);

  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start(startsAt);
  oscillator.stop(endsAt + 0.01);
}

const sounds = {
  click(context, output){
    tone(context, output, {frequency: 520, endFrequency: 440, duration: 0.032, volume: 0.035, type: "sine"});
  },
  combine(context, output){
    tone(context, output, {frequency: 360, endFrequency: 470, duration: 0.07, volume: 0.045, type: "sine"});
    tone(context, output, {frequency: 610, endFrequency: 720, delay: 0.025, duration: 0.065, volume: 0.028, type: "triangle"});
  },
  process(context, output){
    tone(context, output, {frequency: 330, endFrequency: 190, duration: 0.052, volume: 0.05, type: "triangle"});
  },
  collect(context, output){
    tone(context, output, {frequency: 620, endFrequency: 760, duration: 0.11, volume: 0.042, type: "sine"});
    tone(context, output, {frequency: 880, endFrequency: 980, delay: 0.045, duration: 0.12, volume: 0.025, type: "sine"});
  }
};

export function playSound(name){
  const now = performance.now();
  if(now - (lastPlayedAt.get(name) ?? 0) < SOUND_COOLDOWN_MS) return;

  const context = getAudioContext();
  const renderSound = sounds[name];
  if(!context || !masterGain || !renderSound) return;

  lastPlayedAt.set(name, now);

  const previous = activeSounds.get(name);
  if(previous){
    previous.gain.cancelScheduledValues(context.currentTime);
    previous.gain.setTargetAtTime(0.0001, context.currentTime, 0.006);
  }

  const output = context.createGain();
  output.gain.value = 1;
  output.connect(masterGain);
  activeSounds.set(name, output);
  renderSound(context, output);

  window.setTimeout(() => {
    if(activeSounds.get(name) === output) activeSounds.delete(name);
    output.disconnect();
  }, 220);
}
