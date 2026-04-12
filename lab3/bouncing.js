const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const heightSlider = document.getElementById("height");
const heightValue = document.getElementById("heightValue");
const playBtn = document.getElementById("playBtn");
const brookBtn = document.getElementById("brookBtn");

//echo
const delay = audioCtx.createDelay();
const feedback = audioCtx.createGain();
feedback.gain.value = 0.4;
const wetGain = audioCtx.createGain();

delay.delayTime.value = 0.25;
wetGain.gain.value = 0.35;

const filter = audioCtx.createBiquadFilter();
filter.type = "lowpass";
filter.frequency.value = 1200;

delay.connect(filter);
filter.connect(feedback);
feedback.connect(delay);

filter.connect(wetGain);
wetGain.connect(audioCtx.destination);

// get height 
heightSlider.addEventListener("input", () => {
  heightValue.textContent = heightSlider.value;
});

//play sound on click
playBtn.addEventListener("click", () => {
  const height = parseFloat(heightSlider.value);
  playBounceBall(height);
});

function playBounceBall(heightScale = 1) {
  const startTime = audioCtx.currentTime;

  // farnell says 3 seconds but want to make it special for dif heights
  const duration = 2 + heightScale * 2;

  let t = 0;
  let interval = 0.3 * heightScale;

  function scheduleBounce(time, height) {
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0, time);

    gain.gain.linearRampToValueAtTime(height, time + 0.001);
    const decayTime = 0.2 * height;
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      time + 0.001 + decayTime
    );

    const osc = audioCtx.createOscillator();
    osc.type = "square"; //farnell does sine but i think this sounds more like glass

    //farnell says 120, 210, 80
    const baseFreq = 300; 
    const startFreq = 200;
    const endFreq = 100;

    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(
      endFreq,
      time + decayTime
    );

    const offset = audioCtx.createConstantSource();
    offset.offset.value = baseFreq;
    const freqGain = audioCtx.createGain();
    freqGain.gain.value = height * 25; //changed from farnell which had 70hz

    offset.connect(freqGain);
    freqGain.connect(osc.frequency);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    //echo
    gain.connect(delay);

    osc.start(time);
    osc.stop(time + decayTime + 0.05);

    offset.start(time);
    offset.stop(time + decayTime + 0.05);
  }

  while (t < duration) {
    const currentTime = startTime + t;
    const height = Math.pow(1 - t / duration, 2);
    scheduleBounce(currentTime, height);
    interval = 0.3 * height * heightScale;
    t += Math.max(interval, 0.02);
  }
}

//part 1

//for button
let brookStarted = false;
let brookNodes = null;

//brown noise code from prof but changed to use let so it's easier to change values in future 
function brownNoise(audioCtx) {
  const bufferSize = 10 * audioCtx.sampleRate;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);

  let lastOut = 0;
  for (let i = 0; i < bufferSize; i++) {
    const brown = Math.random() * 2 - 1;
    output[i] = (lastOut + (0.02 * brown)) / 1.02;
    lastOut = output[i];
    output[i] *= 3.5;
  }

  const brownNoise = audioCtx.createBufferSource();
  brownNoise.buffer = noiseBuffer;
  brownNoise.loop = true;

  return brownNoise;
}


function startBrook() {
  // LPF.ar(BrownNoise.ar(), 400)
  const mainNoise = brownNoise(audioCtx);
  const mainLPF = audioCtx.createBiquadFilter();
  mainLPF.type = "lowpass";
  mainLPF.frequency.value = 400;

  // RHPF approximation
  const highpass = audioCtx.createBiquadFilter();
  highpass.type = "highpass";
  highpass.Q.value = 1 / 0.03; // sorry i used chatgpt for this i hope thats okay but i was trying to use 0.03 and it wasn't working it said to do this because web audio uses Q value 
  const outputGain = audioCtx.createGain();
  outputGain.gain.value = 0.1; //multiply

  // PF.ar(BrownNoise.ar(), 14) * 400 + 500
  const bn = brownNoise(audioCtx);
  const otherLPF = audioCtx.createBiquadFilter();
  otherLPF.type = "lowpass";
  otherLPF.frequency.value = 14;
  const bnScale = audioCtx.createGain();
  bnScale.gain.value = 400;
  const offset = audioCtx.createConstantSource();
  offset.offset.value = 500;

  
  mainNoise.connect(mainLPF);
  mainLPF.connect(highpass);
  highpass.connect(outputGain);
  outputGain.connect(audioCtx.destination);

  bn.connect(otherLPF);
  otherLPF.connect(bnScale);
  bnScale.connect(highpass.frequency);
  offset.connect(highpass.frequency);

  // start sound 
  mainNoise.start();
  bn.start();
  offset.start();

  brookNodes = {
    mainNoise,
    bn,
    offset,
    outputGain
  };
}

function stopBrook() {
  if (!brookNodes) return;

  const now = audioCtx.currentTime;

  brookNodes.outputGain.gain.cancelScheduledValues(now);
  brookNodes.outputGain.gain.setValueAtTime(brookNodes.outputGain.gain.value, now);
  brookNodes.outputGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

  brookNodes.mainNoise.stop(now + 0.35);
  brookNodes.bn.stop(now + 0.35);
  brookNodes.offset.stop(now + 0.35);

  brookNodes = null;
}

brookBtn.addEventListener("click", async () => {
  if (audioCtx.state === "suspended") {
    await audioCtx.resume();
  }

  if (!brookStarted) {
    startBrook();
    brookStarted = true;
    brookBtn.textContent = "STOP THE BUBBLINGG AHH";
  } else {
    stopBrook();
    brookStarted = false;
    brookBtn.textContent = "Play bubblessss";
  }
});

