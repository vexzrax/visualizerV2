const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const fileInput = document.getElementById('file-input');
const intro = document.querySelector('.intro');
const audio = document.getElementById('audio');

let audioCtx, analyser, source;
let animationId;
let visualMode = 0;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

function randomVisualMode() {
    return Math.floor(Math.random() * 4); // 4 modos visuales diferentes
}

fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    audio.src = url;
    audio.load();
    audio.play();

    intro.classList.add('hide');

    startVisualizer();
});

function startVisualizer() {
    if (audioCtx) audioCtx.close();
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source = audioCtx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);

    visualMode = randomVisualMode();

    audio.onended = () => {
        cancelAnimationFrame(animationId);
        intro.classList.remove('hide');
        ctx.clearRect(0,0,canvas.width,canvas.height);
    };

    render();
}

function render() {
    animationId = requestAnimationFrame(render);

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0,0,width,height);

    // Fondo: colinas verdes sincronizadas con la música
    let data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);

    const hillCount = 3 + visualMode; // número de colinas varía según el modo
    for (let h = 0; h < hillCount; h++) {
        let hillHeight = height * (0.35 + h*0.13);
        let amplitude = (h+1) * 12 + data[8+h*5] * 0.7;
        let freq = 0.005 + h*0.002 + (visualMode*0.001);
        ctx.beginPath();
        ctx.moveTo(0, hillHeight);

        for (let x = 0; x < width; x += 4) {
            let idx = Math.floor((x/width) * data.length);
            let y = hillHeight - Math.sin((x * freq) + Date.now()/350 + h*2) * amplitude
                - (data[idx] || 0) * (0.3 + h*0.08) * Math.sin(Date.now()/600 + h*2);
            ctx.lineTo(x, y);
        }
        ctx.lineTo(width, hillHeight);
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();

        let grd = ctx.createLinearGradient(0, hillHeight, 0, height);
        if (visualMode === 0 || (h%2===0)) {
            grd.addColorStop(0, `rgba(50,255,120,${0.55-h*0.1})`);
            grd.addColorStop(1, `rgba(0,30,0,0.3)`);
        } else {
            grd.addColorStop(0, `rgba(255,255,255,${0.5-h*0.13})`);
            grd.addColorStop(1, `rgba(80,255,200,0.1)`);
        }
        ctx.fillStyle = grd;
        ctx.globalAlpha = 0.6 + 0.08*Math.sin(Date.now()/400 + h);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    // Visualizador psicodélico encima de las colinas
    switch (visualMode) {
        case 0: drawPsychedelicWave(data, width, height); break;
        case 1: drawWhiteSpikes(data, width, height); break;
        case 2: drawGreenBlobs(data, width, height); break;
        case 3: drawFractalWeb(data, width, height); break;
    }
}

// Visualizador 1: Ondas psicodélicas
function drawPsychedelicWave(data, w, h) {
    ctx.save();
    ctx.translate(w/2, h/2);
    for (let t=0; t<2*Math.PI; t+=Math.PI/128) {
        let idx = Math.floor((t/(2*Math.PI))*data.length);
        let r = 180 + data[idx]*1.4;
        let x = Math.cos(t + Date.now()/900) * r;
        let y = Math.sin(t + Date.now()/900) * r;
        ctx.beginPath();
        ctx.arc(x, y, 4 + (data[idx]/30), 0, 2*Math.PI);
        ctx.fillStyle = `rgba(${180+data[idx]},255,${120+data[idx]},0.8)`;
        ctx.shadowColor = "#33ff77";
        ctx.shadowBlur = 15;
        ctx.fill();
    }
    ctx.restore();
    ctx.shadowBlur = 0;
}

// Visualizador 2: Picos blancos
function drawWhiteSpikes(data, w, h) {
    ctx.save();
    ctx.translate(w/2, h*0.7);
    for (let i=0; i<data.length; i+=4) {
        let angle = (i/data.length)*2*Math.PI + Math.sin(Date.now()/700)*0.7;
        let len = 50 + data[i]*2.5;
        ctx.beginPath();
        ctx.moveTo(0,0);
        ctx.lineTo(Math.cos(angle)*len, Math.sin(angle)*len);
        ctx.strokeStyle = `rgba(255,255,255,${0.8 - i/data.length})`;
        ctx.lineWidth = 3 + data[i]/60;
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#fff";
        ctx.stroke();
    }
    ctx.restore();
    ctx.shadowBlur = 0;
}

// Visualizador 3: Blobs verdes flotantes
function drawGreenBlobs(data, w, h) {
    for (let i=0; i<6; i++) {
        let x = (w/7)*(i+1) + Math.sin(Date.now()/400+i)*80;
        let y = h*0.25 + Math.cos(Date.now()/500+i)*100 + data[i*5]*2;
        let r = 50 + data[i*6]*0.8;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2*Math.PI);
        ctx.fillStyle = `rgba(50,255,120,${0.4 + Math.sin(Date.now()/300+i)*0.2})`;
        ctx.shadowColor = "#33ff77";
        ctx.shadowBlur = 30;
        ctx.fill();
    }
    ctx.shadowBlur = 0;
}

// Visualizador 4: Red fractal psicodélica
function drawFractalWeb(data, w, h) {
    let nodes = [];
    for (let i=0; i<data.length; i+=10) {
        let x = w/2 + Math.sin(i*0.14 + Date.now()/920)*220 + data[i]*0.8;
        let y = h/2 + Math.cos(i*0.18 + Date.now()/870)*160 + data[i]*0.7;
        nodes.push({x,y,r: 10+data[i]/25});
    }
    for (let i=0; i<nodes.length; i++) {
        ctx.beginPath();
        ctx.arc(nodes[i].x, nodes[i].y, nodes[i].r, 0, 2*Math.PI);
        ctx.fillStyle = `rgba(255,255,255,0.7)`;
        ctx.shadowColor = "#33ff77";
        ctx.shadowBlur = 20;
        ctx.fill();
        ctx.shadowBlur = 0;
        for (let j=i+1; j<nodes.length; j++) {
            if (Math.abs(nodes[i].x-nodes[j].x)+Math.abs(nodes[i].y-nodes[j].y)<120) {
                ctx.beginPath();
                ctx.moveTo(nodes[i].x, nodes[i].y);
                ctx.lineTo(nodes[j].x, nodes[j].y);
                ctx.strokeStyle = `rgba(50,255,120,0.18)`;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }
    }
}