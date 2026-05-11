/*
* Final Project
* Clara Resnick
* Rocky talkie!!!
*/

// WORDS LETTERS
const SELF_WORDS = new Set(['i','me','my','mine','myself',"i'm","i've","i'll","i'd","we","we'd","us","ours","we've","we'll","we're"]);
//science (i used chatgpt to come up with words and then added my own)
const SCIENCE_WORDS = new Set([
  'math','science','physics','chemistry','biology','astronomy','algebra',
  'calculus','equation','formula','theory','hypothesis','experiment',
  'molecule','atom','cell','dna','rna','gravity','force','energy',
  'quantum','relativity','computer','code','coding','programming', 'biochemistry',
  'algorithm','data','robot','technology','engineering','lab', 'spaceship',
  'scientific','mathematical','number','geometry','statistics', 'hail mary',
  'neuron','electron','proton','neutron','space','orbit','planet',
  'galaxy','star','rocket','satellite','laser','radiation','nuclear',
  'plus','minus','equals','divide','multiply','sum','total','percent', 'centrifuge',
  'Erid', 'Earth', 'Tau', 'Tau Ceti'
]);
//nature
const NATURE_WORDS = new Set([
  'tree','forest','mountain','river','ocean','sea','beach','flower',
  'grass','bird','animal','nature','earth','sky','cloud','rain','snow',
  'wind','sun','moon','lake','valley','hill','desert','jungle','leaf',
  'plant','soil','rock','stone','fish','wolf','bear','deer','fox',
  'water','fire','storm','thunder','lightning','rainbow','spring',
  'autumn','winter','summer','garden','meadow','stream','waterfall',
  'canyon','cave','shore','tide','wave','breeze','fog','mist', 'nature', 'stars','star'
]);
// mood words from nlp.js afin lexicon 
const AFINN = {
  good:3,great:3,love:3,excellent:4,wonderful:4,awesome:4,happy:3,joy:3,
  beautiful:3,fantastic:4,amazing:4,nice:2,like:2,enjoy:2,fun:2,glad:2,
  positive:2,best:3,brilliant:4,delight:3,superb:3,magnificent:4,
  perfect:3,pleased:2,thankful:2,grateful:3,incredible:4,outstanding:4,
  excited:3,thrilled:3,cheerful:3,radiant:3,euphoric:4,bliss:4,yes:1, amaze:4,
  //good ^ bad ->
  bad:-3,hate:-3,terrible:-3,awful:-4,horrible:-4,sad:-3,angry:-3,
  ugly:-2,poor:-2,dislike:-2,boring:-2,dull:-2,negative:-2,worst:-3,
  dumb:-2,stupid:-3,wrong:-2,fear:-2,scary:-2,disgusting:-4,
  miserable:-4,depressing:-3,useless:-2,failure:-2,fail:-2,broken:-2,
  lost:-2,hurt:-2,pain:-2,cry:-2,disappoint:-2,frustrated:-2,
  annoying:-2,irritating:-2,upset:-2,bitter:-2,gloomy:-2,lonely:-2,
  no:-1,not:-1,never:-1,nothing:-2,nobody:-1,nowhere:-1, failure:-3, die:-3, help:-2
};

//NUMBERS
const DIGIT_WORDS = ['zero','one','two','three','four','five','six','seven','eight','nine'];
const ORDINALS = {
  '1st':'first','2nd':'second','3rd':'third','4th':'fourth',
  '5th':'fifth','6th':'sixth','7th':'seventh','8th':'eighth',
  '9th':'ninth','10th':'tenth','11th':'eleventh','12th':'twelfth'
};

// STEPS (inspired by strudel :))
const MODES = {
  positive: [0, 2, 4, 6, 7, 9, 11],  
  neutral:  [0, 2, 3, 5, 7, 9, 10],  
  negative: [0, 1, 3, 5, 7, 8, 10],
};
//number mapping with decimals and signs
function digitsToWords(numStr) {
  let prefix = '';
  if (numStr.startsWith('-')) { prefix = 'negative '; numStr = numStr.slice(1); }
  else if (numStr.startsWith('+')) { numStr = numStr.slice(1); }
  const parts = numStr.split('.');
  const intPart = parts[0].split('').map(d => DIGIT_WORDS[+d] ?? d).join(' ');
  if (parts.length === 1) return (prefix + intPart).trim();
  const decPart = parts[1].split('').map(d => DIGIT_WORDS[+d] ?? d).join(' ');
  return (prefix + intPart + ' point ' + decPart).trim();
}
//i used chatgpt for this function i hope that's okay, i did not know how to do the replace stuff
// but this function seperates the numbers so that the digits to words function can work 
function expandNumbers(text) {
  text = text.replace(/\b(\d{1,2}(?:st|nd|rd|th))\b/gi, m => ORDINALS[m.toLowerCase()] ?? m);
  text = text.replace(/[+-]?\d+(?:\.\d+)?/g, m => digitsToWords(m));
  return text;
}
function letterVal(ch) {
  return ch.toLowerCase().charCodeAt(0) - 96; // a=1 … z=26
}

//similar to nlp.js sentimentAnalyzer but a lot simplier 
function analyzeSentiment(text) {
  const words = text.toLowerCase().replace(/[^a-z\s]/g,'').split(/\s+/);
  let score = 0;
  for (const w of words) if (AFINN[w] !== undefined) score += AFINN[w];
  const avg = score / Math.max(words.length, 1);
  if (avg > 0.15)  return 'positive';
  if (avg < -0.1)  return 'negative';
  return 'neutral';
}

//looks for science or nature topics, will always overwrite to self if self words are in sentence
function detectTopic(text) {
  const words = text.toLowerCase().replace(/[^a-z'\s]/g,'').split(/\s+/);
  for (const w of words) if (SELF_WORDS.has(w)) return 'self';
  let sci = 0, nat = 0;
  for (const w of words) {
    if (SCIENCE_WORDS.has(w)) sci++;
    if (NATURE_WORDS.has(w)) nat++;
  }
  if (sci > 0 && sci >= nat) return 'science';
  if (nat > 0)               return 'nature';
  return 'other';
}

//i had no idea how to make frequencies that would actaully play like chords
// I found this https://webaudioapi.com/book/Web_Audio_API_Boris_Smus_html/ch04.html
// and used it to create this function that will convert the step arrays i have for mode
// into playable audio 
function semitoneFreq(semitones) {
  return 440 * Math.pow(2, semitones/12);
}

//make the actual chord
function buildChord(word, mood, totalWords, wordIndex) {
  const clean = word.replace(/[^a-zA-Z]/g, '');
  if (!clean) return null;
  const letters = clean.toLowerCase().split('');
  const vals = letters.map(letterVal);
  const sum = vals.reduce((a, b) => a + b, 0);
  // only up to 5 like in the book
  const mean = sum / vals.length;
  const variance = vals.reduce((a, v) => a + (v - mean) ** 2, 0) / vals.length;
  const numNotes = Math.max(1, Math.min(5, Math.round(1 + (variance / 80) * 4)));

  //for scale just 0-6 (a,b,c,d,e,f,g)
  const degreeIdx = sum % Math.max(totalWords, 1) % 7;
  // like book if happy then high octave
  const octaveShift = mood === 'positive' ? 12 : mood === 'negative' ? -12 : 0;
  const modeSteps = MODES[mood];
  const freqs = [];
  for (let i = 0; i < numNotes; i++) {
    const modePos = (degreeIdx + i * 2) % 7; //2 steps away always
    freqs.push(semitoneFreq(modeSteps[modePos] + octaveShift));
  }
  // make the early words fast, last words longer
  const pos = wordIndex / Math.max(totalWords - 1, 1);
  let repeats;
  if (totalWords === 1){
    repeats = 2;
  }
  else if (wordIndex === totalWords - 1){
    repeats = 1;
  }
  else if (pos < 0.33){
    repeats = 4;
  }
  else if (pos < 0.66){
    repeats = 3;
  }
  else{
    repeats = 2;
  }
  return {freqs, repeats, numNotes};
}

//ACTUAL AUDIO STUFF
let audioCtx    = null;
let activeNodes = [];
let isPlaying   = false;
let animFrameId = null;

function ensureAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function stopAll() {
  isPlaying = false;
  for (const n of activeNodes) { try { n.stop(); n.disconnect(); } catch(e) {} }
  activeNodes = [];
  cancelAnimationFrame(animFrameId);
}

//  play audio
function handlePlay(rawInput) {
  if (!rawInput.trim()) return;
  stopAll();
  ensureAudio();
  isPlaying = true;
  // if numbers expand
  const text = expandNumbers(rawInput.trim());
  //analyze everything
  const mood = analyzeSentiment(text);
  const topic = detectTopic(text);
  const endsExclaim  = text.trimEnd().endsWith('!');
  const endsQuestion = text.trimEnd().endsWith('?');
  //osc
  const oscTypeMap = { self:'square', science:'sawtooth', nature:'triangle', other:'sine' };
  const oscType = oscTypeMap[topic];
  // split into individual words
  const rawWords = text.split(/\s+/).filter(w => w.length > 0);
  const cleanWords = rawWords.map(w => w.replace(/[^a-zA-Z]/g, '')).filter(w => w.length > 0);
  const totalWords = cleanWords.length;
  // play audio after a bit of time
  const BASE_DUR = 0.22;
  let t = audioCtx.currentTime + 0.05;
  const masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.3;
  masterGain.connect(audioCtx.destination);
  let wordIndex = 0;
  for (const rawWord of rawWords) {
    if (!isPlaying) break;
    const clean = rawWord.replace(/[^a-zA-Z]/g, ''); //again used chatgpt, never done this replace thing before hope thats okay
    if (!clean) continue;
    const chord = buildChord(clean, mood, totalWords, wordIndex);
    wordIndex++;
    if (!chord) continue;
    const {freqs,repeats} = chord;
    const repDur = BASE_DUR / repeats;
    for (let rep = 0; rep < repeats; rep++) {
      const st = t + rep * repDur;
      const et = st + repDur * 0.88;
      for (const freq of freqs) {
        const osc = audioCtx.createOscillator();
        osc.type = oscType;
        osc.frequency.setValueAtTime(freq, st);
        //no clipping :)
        const env = audioCtx.createGain();
        env.gain.setValueAtTime(0, st);
        env.gain.linearRampToValueAtTime(0.6 / freqs.length, st + 0.012);
        env.gain.linearRampToValueAtTime(0, et);
        osc.connect(env);
        let lastNode = env;
        //mood filters
        if (mood === 'positive') {
          const hpf = audioCtx.createBiquadFilter();
          hpf.type = 'highpass';
          hpf.frequency.value = 2000;
          lastNode.connect(hpf);
          lastNode = hpf;
        } else if (mood === 'negative') {
          const lpf = audioCtx.createBiquadFilter();
          lpf.type = 'lowpass';
          lpf.frequency.value = 600;
          lastNode.connect(lpf);
          lastNode = lpf;
        }
        // AM
        if (endsExclaim) {
          const amGain = audioCtx.createGain();
          amGain.gain.value = 1;
          const amMod = audioCtx.createOscillator();
          amMod.type = 'sine';
          amMod.frequency.value = 800;
          const amModGain = audioCtx.createGain();
          amModGain.gain.value = 0.5;
          amMod.connect(amModGain);
          amModGain.connect(amGain.gain);
          lastNode.connect(amGain);
          lastNode = amGain;
          amMod.start(st);
          amMod.stop(et + 0.05);
          activeNodes.push(amMod);
        }
        // FM
        if (endsQuestion) {
          const fmMod = audioCtx.createOscillator();
          fmMod.type = 'sine';
          fmMod.frequency.value = 125;
          const fmModGain = audioCtx.createGain();
          fmModGain.gain.value = 750;
          fmMod.connect(fmModGain);
          fmModGain.connect(osc.frequency);
          fmMod.start(st);
          fmMod.stop(et + 0.05);
          activeNodes.push(fmMod);
        }
        lastNode.connect(masterGain);
        osc.start(st);
        osc.stop(et + 0.05);
        activeNodes.push(osc);
      }
    }
    t += BASE_DUR + 0.06;
  }
  // stop everything
  const remaining = (t - audioCtx.currentTime) * 1000;
  setTimeout(() => { isPlaying = false; }, Math.max(0, remaining + 250));
}

// make buttons work 
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('translateForm');
  const input = document.getElementById('userInput');

  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      handlePlay(input.value);
    });
  }
});
