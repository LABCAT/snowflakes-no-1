import { Midi } from '@tonejs/midi';
import Snowflake from './classes/Snowflake.js';

const audio = new URL("@audio/snowflakes-no-1.mp3", import.meta.url).href;
const midi = new URL("@audio/snowflakes-no-1.mid", import.meta.url).href;
const vertShader = new URL("@shaders/basic.vert", import.meta.url).href;
const fragShader = new URL("@shaders/gradient.frag", import.meta.url).href;


const SnowflakesNo1 = (p) => {
    p.song = null;
    p.audioLoaded = false;
    p.songHasFinished = false;
    p.snowflakes = [];
    p.shaderBg = null;

    p.preload = async () => {
        p.shaderBg = p.loadShader(vertShader, fragShader);
        // Load the song and start the audio
        p.song = await p.loadSound(audio, async () => {
            await p.loadMidi();
            p.audioLoaded = true;
            p.song.onended(() => {
                p.songHasFinished = true;
                document.getElementById('play-icon').classList.add('fade-in');
            });
        });
    };

    p.loadMidi = () => {
        // Load and parse the MIDI file
        Midi.fromUrl(midi).then((result) => {
            console.log('MIDI loaded:', result);
            const track1 = result.tracks[4].notes; // Layers Wave Edition - Digital Rain
            p.scheduleCueSet(track1, 'executeTrack1');
            document.getElementById("loader").classList.add("loading--complete");
            document.getElementById('play-icon').classList.add('fade-in');
            p.audioLoaded = true;
        });
    };

    p.scheduleCueSet = (noteSet, callbackName) => {
        let lastTicks = -1, currentCue = 1;
        for (let i = 0; i < noteSet.length; i++) {
            const note = noteSet[i], { ticks, time } = note;
            if (ticks !== lastTicks) {
                note.currentCue = currentCue;
                p.song.addCue(time, p[callbackName], note);
                lastTicks = ticks;
                currentCue++;
            }
        }
    };

    p.setup = () => {
        // Set up the canvas
        p.createCanvas(p.windowWidth, p.windowHeight);
        p.background(0);
    };

    p.draw = () => {
        if (p.audioLoaded && p.song.isPlaying()) {
            // p.shader(p.shaderBg);
            // p.shaderBg.setUniform('uResolution', [p.width, p.height]);
            // p.shaderBg.setUniform('uTime', p.millis() / 1000.0);
            // p.rect(0, 0, p.width, p.height);

            // p.resetMatrix();
            // p.translate(-p.width / 2, -p.height / 2);
            p.background(0);
            for (let i = p.snowflakes.length - 1; i >= 0; i--) {
                p.snowflakes[i].update();
                p.snowflakes[i].draw();
            }
        }
    };

    p.executeTrack1 = ({ currentCue }) => {
        if (currentCue % 8 === 1) {
            p.snowflakes = [];
        }

        const maxAttempts = 100;
        let placed = false;
        let attempts = 0;

        while (!placed && attempts < maxAttempts) {
            const size = p.random(50, 100);
            const x = p.random(size, p.width - size);
            const y = p.random(size, p.height - size);

            let overlap = false;
            for (let i = 0; i < p.snowflakes.length; i++) {
                const other = p.snowflakes[i];
                const d = p.dist(x, y, other.loc.x, other.loc.y);
                if (d < size + other.size) {
                    overlap = true;
                    break;
                }
            }

            if (!overlap) {
                p.snowflakes.push(new Snowflake(p, x, y, size));
                placed = true;
            }

            attempts++;
        }
    };


    p.mousePressed = () => {
        if (p.audioLoaded) {
            if (p.song.isPlaying()) {
                p.song.pause();
            } else {
                if (parseInt(p.song.currentTime()) >= parseInt(p.song.buffer.duration)) {
                    if (typeof window.dataLayer !== typeof undefined) {
                        window.dataLayer.push({
                            'event': 'play-animation',
                            'animation': {
                                'title': document.title,
                                'location': window.location.href,
                                'action': 'replaying'
                            }
                        });
                    }
                }
                document.getElementById("play-icon").classList.remove("fade-in");
                p.song.play();
                if (typeof window.dataLayer !== typeof undefined && !p.hasStarted) {
                    window.dataLayer.push({
                        'event': 'play-animation',
                        'animation': {
                            'title': document.title,
                            'location': window.location.href,
                            'action': 'start playing'
                        }
                    });
                }
            }
        }
    };
};

export default SnowflakesNo1;
