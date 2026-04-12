const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const heightSlider = document.getElementById("height");
const heightValue = document.getElementById("heightValue");
const playBtn = document.getElementById("playBtn");


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