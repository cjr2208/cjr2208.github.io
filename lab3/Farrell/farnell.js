// {RHPF.ar(LPF.ar(BrownNoise.ar(), 400), LPF.ar(BrownNoise.ar(), 14) * 400 + 500, 0.03, 0.1)}.play
// RHPF.ar(in: 0.0, freq: 440.0, rq: 1.0, mul: 1.0, add: 0.0)
// in: The input signal.
// freq: Cutoff frequency in Hertz.
// rq: The reciprocal of Q (bandwidth / cutoffFreq).
// mul: Output will be multiplied by this value.


// 1. brown noise goes through low pass filter at 400 freq this is input signal for 
// resonant high pass filter
// 2. brown noise goes through low pass filter at 14 freq, then is multiplied by 400
// so gain 400, then add 500 frequency so another oscilator at 500 is added to same node
// then this is cutoff frequency for resonant high pass filter    
// 3. 0.03 is the reciprocal of Q or the bandwidth 
// 4. 0.1 everything is multiplied by 0.1 so output/everything gained by 0.1

(function () {
    var playBtn = document.getElementById("playBtn");
    if (!playBtn) {
        return;
    }

    var started = false;

    function createBrownNoiseSource(ctx) {
        var bufferSize = 10 * ctx.sampleRate;
        var noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        var output = noiseBuffer.getChannelData(0);
        var lastOut = 0;

        for (var i = 0; i < bufferSize; i++) {
            var brown = Math.random() * 2 - 1;
            output[i] = (lastOut + 0.02 * brown) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5;
        }

        var source = ctx.createBufferSource();
        source.buffer = noiseBuffer;
        source.loop = true;
        return source;
    }

    function startBrook() {
        if (started) {
            return;
        }
        started = true;

        var ctx = new (window.AudioContext || window.webkitAudioContext)();
        var brownNoise = createBrownNoiseSource(ctx);

        // 1st LPF
        var filter1 = ctx.createBiquadFilter();
        filter1.type = "lowpass";
        filter1.frequency.value = 400;

        // 2nd LPF
        var filter2 = ctx.createBiquadFilter();
        filter2.type = "lowpass";
        filter2.frequency.value = 30; //change to 30 for more bubbly effect

        var multi = ctx.createGain();
        multi.gain.value = 400;

        var move = ctx.createConstantSource();
        move.offset.value = 500;

        // RHPF(..., freq, rq, mul)
        var rhpf = ctx.createBiquadFilter();
        rhpf.type = "highpass";
        rhpf.Q.value = 1 / 0.03;

        var outGain = ctx.createGain();
        outGain.gain.value = 0.1;

        brownNoise.connect(filter1);
        filter1.connect(rhpf);

        brownNoise.connect(filter2);
        filter2.connect(multi);
        rhpf.frequency.value = 0;
        multi.connect(rhpf.frequency);
        move.connect(rhpf.frequency);

        rhpf.connect(outGain);
        outGain.connect(ctx.destination);

        move.start();
        brownNoise.start();

        if (ctx.state !== "running") {
            ctx.resume();
        }
    }

    playBtn.addEventListener("click", startBrook);
})();
