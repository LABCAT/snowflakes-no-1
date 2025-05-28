import { Midi } from '@tonejs/midi';
import Snowflake from './classes/Snowflake.js';

const audio = new URL("@audio/snowflakes-no-1.mp3", import.meta.url).href;
const midi = new URL("@audio/snowflakes-no-1.mid", import.meta.url).href;
const vertShader = new URL("@shaders/basic.vert", import.meta.url).href;
const fragShader = new URL("@shaders/gradient.frag", import.meta.url).href;

/**
 * Inspiration:
 * https://cloudfour.com/thinks/coding-a-snowflake-generator/
 * https://www.shadertoy.com/view/Xsd3zf
 * https://openprocessing.org/sketch/790571
 * https://openprocessing.org/sketch/1891515
 */
const SnowflakesNo1 = (p) => {
    p.song = null;
    p.audioLoaded = false;
    p.songHasFinished = false;
    p.snowflakes = [];
    p.shaderBg = null;
    p.PPQ = 3840 * 4;
    p.bpm = 144;

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
        p.pixelDensity(1);
        p.bgBuffer = p.createGraphics(p.width, p.height, p.WEBGL);
        p.bgBuffer.shader(p.shaderBg);
        p.shaderBg.setUniform('uResolution', [p.width, p.height]);
        p.shaderBg.setUniform('uTime', p.millis() / 1000.0);
        p.bgBuffer.rect(0, 0, p.width, p.height);
        p.image(p.bgBuffer, 0, 0, p.width, p.height);
    };

    p.draw = () => {
        if (p.audioLoaded && p.song.isPlaying()) {
            p.bgBuffer.shader(p.shaderBg);
            p.shaderBg.setUniform('uResolution', [p.width, p.height]);
            p.shaderBg.setUniform('uTime', p.millis() / 1000.0);
            p.bgBuffer.rect(0, 0, p.width, p.height);
            p.image(p.bgBuffer, 0, 0, p.width, p.height);

            for (let i = p.snowflakes.length - 1; i >= 0; i--) {
                p.snowflakes[i].update();
                p.snowflakes[i].draw();
            }
        }
    };

    p.executeTrack1 = (note) => {
        const { currentCue, durationTicks } = note;
        const duration = (durationTicks / p.PPQ) * (60 / p.bpm);
        
        if (currentCue % 8 === 1) {
            p.snowflakes = [];
        }

        if (currentCue % 8 === 0) {
            // reset animation start and duration
            p.snowflakes.forEach(sf => {
                sf.duration = duration * 1000;
                sf.birthTime = p.song.currentTime() * 1000; 
                sf.reversed = true;
            });
        } else {
            const size = p.random(50, 100);
            const x = p.random(size, p.width - size);
            const y = p.random(size, p.height - size);
            p.snowflakes.push(new Snowflake(p, x, y, duration));
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
