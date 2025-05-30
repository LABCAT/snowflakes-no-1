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

    p.patterns = ['circle', 'grid', 'pentagon', 'heptagon', 'plus-sign', 'radial-spoke', 'wave'];

    p.snowflakePositions = [];
    
    p.patternIndex = 0;

    p.currentPattern = null;

    p.executeTrack1 = (note) => {
        const { currentCue, durationTicks } = note;
        const duration = (durationTicks / p.PPQ) * (60 / p.bpm);
        
        if (currentCue % 8 === 1) {
            if (currentCue === 1) {
                p.patterns = p.shuffle(['circle', 'grid', 'pentagon', 'heptagon', 'plus-sign', 'radial-spoke', 'wave']);
            }
            p.snowflakes = [];
            p.currentPattern = p.patterns[p.patternIndex];
            p.generatePatternPositions()
            p.patternIndex++;
        }

        if (currentCue % 8 === 0) {
            // reset animation start and duration
            p.snowflakes.forEach(sf => {
                sf.duration = duration * 1000;
                sf.birthTime = p.song.currentTime() * 1000; 
                sf.reversed = currentCue > 40 ? false : Math.random() < 0.5;
            });
        } else {
            const index = (currentCue % 8) - 1;
            const [x, y] = p.snowflakePositions[index];
            p.snowflakes.push(new Snowflake(p, x, y, duration));
        }
    };

    p.generatePatternPositions = () => {
        p.snowflakePositions = [];
        const centerX = p.width / 2;
        const centerY = p.height / 2;
        const isPortrait = p.height > p.width;

        switch (p.currentPattern) {
            case 'wave': {
                const amplitude = Math.min(p.width, p.height) * 0.2;
                const spacing = isPortrait ? p.height / 8 : p.width / 8;

                for (let i = 0; i < 7; i++) {
                    const t = i / 6; // 0 to 1
                    if (isPortrait) {
                        const y = spacing * (i + 1);
                        const x = centerX + Math.sin(t * p.TWO_PI) * amplitude;
                        p.snowflakePositions.push([x, y]);
                    } else {
                        const x = spacing * (i + 1);
                        const y = centerY + Math.sin(t * p.TWO_PI) * amplitude;
                        p.snowflakePositions.push([x, y]);
                    }
                }
                break;
            }
            case 'radial-spoke': {
                const centerX = p.width / 2;
                const centerY = p.height / 2 + p.height / 16;
                const radiusInner = Math.min(p.width, p.height) * 0.25;
                const radiusOuter = Math.min(p.width, p.height) * 0.42;
                const offset = -p.HALF_PI;

                p.snowflakePositions.push([centerX, centerY]);

                for (let i = 0; i < 3; i++) {
                    const angle = p.TWO_PI * (i / 3) + offset;

                    const xInner = centerX + radiusInner * Math.cos(angle);
                    const yInner = centerY + radiusInner * Math.sin(angle);
                    p.snowflakePositions.push([xInner, yInner]);

                    const xOuter = centerX + radiusOuter * Math.cos(angle);
                    const yOuter = centerY + radiusOuter * Math.sin(angle);
                    p.snowflakePositions.push([xOuter, yOuter]);
                }
                break;
            }
           case 'plus-sign': {
                const centerX = p.width / 2;
                const centerY = p.height / 2;
                const spacing = Math.min(p.width, p.height) * 0.3;
                p.snowflakePositions.push([centerX, centerY]);

                const xOffsets = isPortrait ? [0, 0, 0, 0, -spacing, spacing] : [-spacing * 2, -spacing, spacing, spacing * 2, 0, 0];
                const yOffsets = isPortrait ? [-spacing * 2, -spacing, spacing, spacing * 2, 0, 0] : [0, 0, 0, 0, -spacing, spacing];

                for (let i = 0; i < xOffsets.length; i++) {
                    p.snowflakePositions.push([centerX + xOffsets[i], centerY + yOffsets[i]]);
                }
                break;
            }
            case 'grid': {
                const colCount = isPortrait ? [2, 3, 2] : [2, 3, 2];
                const colSpacing = p.width / 4;
                const rowSpacing = p.height / 4;
                const positions = [];

                colCount.forEach((cols, row) => {
                    for (let i = 0; i < cols; i++) {
                    const x = isPortrait
                        ? colSpacing * (1 + i + (3 - cols) / 2)
                        : colSpacing * (row + 1);
                    const y = isPortrait
                        ? rowSpacing * (row + 1)
                        : rowSpacing * (1 + i + (3 - cols) / 2);
                    positions.push([x, y]);
                    }
                });

                p.snowflakePositions = positions;
                break;
            }
            case 'pentagon': {
                const radius = Math.min(p.width, p.height) * 0.3;
                const angleOffset = -p.HALF_PI;
                for (let i = 0; i < 5; i++) {
                    const angle = p.TWO_PI * (i / 5) + angleOffset;
                    const x = centerX + radius * Math.cos(angle);
                    const y = centerY + radius * Math.sin(angle);
                    p.snowflakePositions.push([x, y]);
                }
                const extraPoints = [
                    isPortrait ? [centerX, p.height * 0.1] : [p.width * 0.1, centerY],
                    isPortrait ? [centerX, p.height * 0.9] : [p.width * 0.9, centerY]
                ];
                p.snowflakePositions.push(...extraPoints);
                break;
            }
            case 'heptagon': {
                const radius = Math.min(p.width, p.height) * 0.3;
                const angleOffset = -p.HALF_PI;
                for (let i = 0; i < 7; i++) {
                    const angle = p.TWO_PI * (i / 7) + angleOffset;
                    const x = centerX + radius * Math.cos(angle);
                    const y = centerY + radius * Math.sin(angle);
                    p.snowflakePositions.push([x, y]);
                }
                break;
            }
            case 'circle':
            default: {
                p.snowflakePositions.push([centerX, centerY]);
                const radius = Math.min(p.width, p.height) * 0.25;
                for (let i = 0; i < 6; i++) {
                    const angle = p.TWO_PI * (i / 6);
                    const x = centerX + radius * Math.cos(angle);
                    const y = centerY + radius * Math.sin(angle);
                    p.snowflakePositions.push([x, y]);
                }
                break;
            }
        }
        p.snowflakePositions = p.shuffle(p.snowflakePositions);
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
                p.patternIndex = 0;
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
