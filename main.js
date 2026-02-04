document.addEventListener("DOMContentLoaded", function(event) {

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    var wave = 'sine';
    const keyboardFrequencyMap = {
    '90': 261.625565300598634,  //Z - C
    '83': 277.182630976872096, //S - C#
    '88': 293.664767917407560,  //X - D
    '68': 311.126983722080910, //D - D#
    '67': 329.627556912869929,  //C - E
    '86': 349.228231433003884,  //V - F
    '71': 369.994422711634398, //G - F#
    '66': 391.995435981749294,  //B - G
    '72': 415.304697579945138, //H - G#
    '78': 440.000000000000000,  //N - A
    '74': 466.163761518089916, //J - A#
    '77': 493.883301256124111,  //M - B
    '81': 523.251130601197269,  //Q - C
    '50': 554.365261953744192, //2 - C#
    '87': 587.329535834815120,  //W - D
    '51': 622.253967444161821, //3 - D#
    '69': 659.255113825739859,  //E - E
    '82': 698.456462866007768,  //R - F
    '53': 739.988845423268797, //5 - F#
    '84': 783.990871963498588,  //T - G
    '54': 830.609395159890277, //6 - G#
    '89': 880.000000000000000,  //Y - A
    '55': 932.327523036179832, //7 - A#
    '85': 987.766602512248223,  //U - B
    }
    const images = [
    "images/ja1.jpg",
    "images/ja2.jpg",
    "images/ja3.jpg",
    "images/ja4.jpg",
    "images/ja5.jpg",
    "images/ja6.jpg",
    "images/ja7.jpg",
    "images/ja8.jpg",
    "images/ja9.jpg",
    "images/ja10.jpg",
    "images/ja11.jpg",
    "images/ja12.jpg",
    "images/ja13.jpg",
    "images/ja14.jpg",
    "images/ja15.jpg",
    "images/ja16.jpg",
    "images/ja17.jpg",
    ];

    const globalGain = audioCtx.createGain(); //this will control the volume of all notes
    globalGain.gain.setValueAtTime(0.8, audioCtx.currentTime)
    globalGain.connect(audioCtx.destination);
    const max = 0.8;
    
    const buttons = document.querySelectorAll(".wave");
    buttons.forEach(function (button) {
        button.addEventListener('click', function () {
        changeWave(button.textContent);
        });
    });

    window.addEventListener('keydown', keyDown, false);
    window.addEventListener('keyup', keyUp, false);

    activeOscillators = {}

    function keyDown(event) {
        const key = (event.detail || event.which).toString();
        if (keyboardFrequencyMap[key] && !activeOscillators[key]) {
            playNote(key);
        }
    }

    function keyUp(event) {
        const key = (event.detail || event.which).toString();
        if (keyboardFrequencyMap[key] && activeOscillators[key]) {
            const { osc, gainNode } = activeOscillators[key];
            const time = audioCtx.currentTime;
            const releaseEM = 0.2; 
            gainNode.gain.cancelScheduledValues(time);
            gainNode.gain.setValueAtTime(Math.max(gainNode.gain.value, 0.00001), time); //I'm using setValueAtTime here instead of set target like you said
            gainNode.gain.exponentialRampToValueAtTime(0.00001, time + releaseEM); // I tried to get setTarget to work but I kept having clicking issues
            osc.stop(time + releaseEM + 0.01);
            delete activeOscillators[key];
            fixAmps();
        }
    }

    function playNote(key) {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        const time = audioCtx.currentTime;
        osc.frequency.setValueAtTime(keyboardFrequencyMap[key], time)
        osc.type = wave //choose your favorite waveform
        osc.connect(gainNode);
        gainNode.connect(globalGain);
        activeOscillators[key] = {osc, gainNode};
        fixAmps();
        const target = max / Object.keys(activeOscillators).length;
        //console.log("target:", target);
        gainNode.gain.cancelScheduledValues(time);
        gainNode.gain.setValueAtTime(0.00001, time);
        gainNode.gain.exponentialRampToValueAtTime(target, time + 0.15);
        osc.start(time);
        randoGoBills();
  }

  function changeWave(waveName){
    wave = waveName;
  }

  function fixAmps() {
    const notes = Object.values(activeOscillators);
    const time = audioCtx.currentTime;
    if (notes.length == 0) return;
    const noteGain = max / notes.length;

    notes.forEach(({ gainNode }) => {
        gainNode.gain.cancelScheduledValues(time);
        const current = Math.max(gainNode.gain.value, 0.00001);
        gainNode.gain.setValueAtTime(current, time);
        gainNode.gain.linearRampToValueAtTime(noteGain, time + 0.01);
        //console.log("current:", current);

    });
  }

  function randoGoBills(){
    const img = document.createElement("img");
    const src = images[Math.floor(Math.random() * images.length)];
    img.src = src;

    img.style.position = "fixed";
    img.style.width = "300px";
    img.style.pointerEvents = "none";
    img.style.opacity = "0";
    img.style.transform = "scale(0.5)";
    img.style.transition = "opacity 0.2s ease, transform 0.2s ease";

    const x = Math.random()*(window.innerWidth - 300);
    const y = Math.random()*(window.innerHeight -300);

    img.style.left = `${x}px`;
    img.style.top = `${y}px`;
    document.body.appendChild(img);
    requestAnimationFrame(() => {
        img.style.opacity = "1";
        img.style.transform = "scale(1)";
    });

    setTimeout(() => {
        img.style.opacity = "0";
        img.style.transform = "scale(0.7)";
    }, 700);

    setTimeout(() => img.remove(), 1000);
  }
});