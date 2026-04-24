const SIZE = 10;

const startBtn = document.getElementById('start');
const pauseBtn = document.getElementById('pause');
const clearBtn = document.getElementById('clear');
const randomBtn = document.getElementById('random');
const gridTable = document.getElementById('grid');

let grid = createEmptyGrid();
let running = false;
let timer = null;
let soundTimer = null;

let audioCtx = null;
let masterGain = null;
let cellVideos = [];
let cellSounds = [];
// got notes from this website: https://mixbutton.com/music-tools/frequency-and-pitch/music-note-to-frequency-chart
// had to rearrange because theirs is 12x8 since 8 octavies and 12 notes, ended up just randomizing the order using chatgpt
let notes = [
  [739.99, 220.00, 1567.98, 87.31, 3135.96, 293.66, 61.74, 1661.22, 415.30, 1975.53],
  [830.61, 138.59, 329.63, 2489.02, 92.50, 466.16, 1174.66, 49.00, 587.33, 2959.96],
  [440.00, 2093.00, 73.42, 3520.00, 1108.73, 174.61, 622.25, 98.00, 2637.02, 1479.98],
  [392.00, 261.63, 1318.51, 51.91, 2349.32, 783.99, 207.65, 659.25, 1046.50, 1760.00],
  [554.37, 38.89, 166.81, 1244.51, 277.18, 3729.31, 185.00, 493.88, 2793.83, 69.30],
  [349.23, 2959.96, 233.08, 103.83, 880.00, 146.83, 4186.01, 932.33, 155.56, 2217.46],
  [587.33, 830.61, 1174.66, 207.65, 293.66, 65.41, 739.99, 311.13, 2489.02, 1396.91],
  [493.88, 2093.00, 622.25, 440.00, 1567.98, 92.50, 1760.00, 2349.32, 783.99, 329.63],
  [1479.98, 261.63, 1318.51, 51.91, 174.61, 2637.02, 98.00, 1046.50, 392.00, 659.25],
  [830.61, 207.65, 293.66, 739.99, 1174.66, 311.13, 2489.02, 1396.91, 65.41, 587.33]
];

function createEmptyGrid() {
  let life = [];
  for (let r = 0; r < SIZE; r++) {
    let row = [];
    for (let c = 0; c < SIZE; c++) {
      row.push(false);
    }
    life.push(row);
  }
  return life;
}

function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.5;
    masterGain.connect(audioCtx.destination);
  }

  if (audioCtx.state === 'suspended') {
    return audioCtx.resume();
  }
  return Promise.resolve();
}

function getVideoPath(row, col) {
  let num = Math.floor(Math.random() * 6) + 1;
  return 'videos/' + num + '.mov';
}

function cellFrequency(row, col) {
  
  return notes[row][col];
}

function startCellSound(row, col) {
  if (!audioCtx) return;
  if (cellSounds[row][col]) return;

  let now = audioCtx.currentTime;
  let osc = audioCtx.createOscillator();
  let gain = audioCtx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(cellFrequency(row, col), now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.08, now + 0.05);

  osc.connect(gain);
  gain.connect(masterGain);

  osc.start(now);

  cellSounds[row][col] = {
    osc: osc,
    gain: gain
  };
}

function stopCellSound(row, col) {
  let sound = cellSounds[row][col];
  if (!sound) return;

  let now = audioCtx.currentTime;

  sound.gain.gain.cancelScheduledValues(now);
  sound.gain.gain.setValueAtTime(sound.gain.gain.value, now);
  sound.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

  sound.osc.stop(now + 0.06);
  cellSounds[row][col] = null;
}

function updateSounds() {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c]) {
        startCellSound(r, c);
      } else {
        stopCellSound(r, c);
      }
    }
  }
}

function neighbors(row, col) {
  let count = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;

      let r2 = row + dr;
      let c2 = col + dc;

      if (r2 >= 0 && r2 < SIZE && c2 >= 0 && c2 < SIZE) {
        if (grid[r2][c2]) count++;
      }
    }
  }
  return count;
}

function nextGen() {
  let next = createEmptyGrid();

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      let alive = grid[r][c];
      let n = neighbors(r, c);

      if (alive && (n === 2 || n === 3)) next[r][c] = true;
      else if (!alive && n === 3) next[r][c] = true;
    }
  }
  grid = next;
  generation++;
  updateAll();
}

function updateVideos() {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      let v = cellVideos[r][c];
      if (!v) continue;

      if (grid[r][c]) {
        let p = v.play();
        if (p && p.catch) p.catch(() => {});
      } else {
        v.pause();
      }
    }
  }
}

function updateColors() {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      let td = document.getElementById('cell-' + r + '-' + c);
      td.setAttribute('bgcolor', grid[r][c] ? 'pink' : 'white');
    }
  }
}

function updateAll() {
  updateColors();
  updateVideos();
  updateSounds();
}

function toggleCell(r, c) {
  grid[r][c] = !grid[r][c];
  updateAll();

  ensureAudio().then(function () {
    if (grid[r][c]) {
      playNote(r, c);
    }
  });
}

function buildGrid() {
  cellVideos = [];
  cellSounds = [];
  gridTable.innerHTML = '';

  for (let r = 0; r < SIZE; r++) {
    let tr = document.createElement('tr');
    let rowVideos = [];
    let rowSounds = [];

    for (let c = 0; c < SIZE; c++) {
      let td = document.createElement('td');
      td.id = 'cell-' + r + '-' + c;
      td.width = 140;
      td.height = 75;

      let video = document.createElement('video');
      video.src = getVideoPath(r, c);
      video.width = 140;
      video.height = 75;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.style.objectFit = 'cover';

      td.appendChild(video);

      td.addEventListener('click', function () {
        toggleCell(r, c);
      });

      tr.appendChild(td);
      rowVideos.push(video);
      rowSounds.push(null);
    }

    gridTable.appendChild(tr);
    cellVideos.push(rowVideos);
    cellSounds.push(rowSounds);
  }
}

function playAliveCellsWhilePaused() {
  ensureAudio().then(function () {
    updateSounds();
  });
}

startBtn.onclick = function () {
  ensureAudio().then(function () {
    running = true;
    timer = setInterval(nextGen, 1500);
  });
};

pauseBtn.onclick = function () {
  running = false;
  clearInterval(timer);
  timer = null;
};

clearBtn.onclick = function () {
  running = false;
  clearInterval(timer);
  grid = createEmptyGrid();
  generation = 0;
  updateAll();
};

randomBtn.onclick = function () {
  running = false;
  clearInterval(timer);

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      grid[r][c] = Math.random() > 0.7;
    }
  }

  generation = 0;
  updateAll();
};

soundTimer = setInterval(function () {
  if (!running) {
    playAliveCellsWhilePaused();
  }
}, 1500);



buildGrid();
updateAll();

