import { Midi } from '@tonejs/midi';

const audio = new URL("@audio/snowflakes-no-1.mp3", import.meta.url).href;
const midi = new URL("@audio/snowflakes-no-1.mid", import.meta.url).href;
const vertShader = new URL("@shaders/basic.vert", import.meta.url).href;
const fragShader1 = new URL("@shaders/snowflake.frag", import.meta.url).href;

const SnowflakesNo1 = (p) => {
    p.song = null;
    p.audioLoaded = false;
    p.songHasFinished = false;

    p.shaders = [];
    p.flowerPointer = { x: 0.5, y: 0.5, grow: false };
    p.time = 0;

    p.preload = async () => {
        // Load the shaders
        p.shaders.push(p.loadShader(vertShader, fragShader1));

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

    p.setup = () => {
        // Set up the canvas
        p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
        // p.pixelDensity(1);
    };

    p.draw = () => {
        p.background(0);
    
        // Ensure there is at least one shader loaded
        if (p.shaders.length > 0) {
            p.shader(p.shaders[0]);
    
            // Set shader uniforms
            p.shaders[0].setUniform('u_ratio', p.width / p.height);
            p.shaders[0].setUniform('u_time', p.time);
            // Position the flower in normalized coordinates (0-1)
            p.shaders[0].setUniform('u_point', [0.5, 0.5]); // Center of screen
            p.shaders[0].setUniform('u_moving', 0.0); // Set to 0 to show the flower
            // Keep u_stop_time at a small value to prevent the flower from disappearing
            p.shaders[0].setUniform('u_stop_time', 0.16); // Just below the 0.17 threshold in the shader
            p.shaders[0].setUniform('u_stop_randomizer', [0.5, 0.5]); // Random values for flower appearance
            p.shaders[0].setUniform('u_clean', 1.0); // Make flower fully visible
    
            // Draw a rectangle that covers the entire canvas in normalized coordinates
            p.rectMode(p.CENTER);
            p.rect(0, 0, p.width, p.height);
        }
    
        // Update time for animation - but don't let it affect flower visibility
        if (p.audioLoaded && p.song.isPlaying()) {
            p.time += p.deltaTime / 1000;
        } else {
            // Even when not playing, we still want to animate the flower
            p.time += p.deltaTime / 1000;
        }
    };
    

    p.mousePressed = () => {
        if(p.audioLoaded){
            if (p.song.isPlaying()) {
                p.song.pause();
            } else {
                if (parseInt(p.song.currentTime()) >= parseInt(p.song.buffer.duration)) {
                    if (typeof window.dataLayer !== typeof undefined){
                        window.dataLayer.push(
                            { 
                                'event': 'play-animation',
                                'animation': {
                                    'title': document.title,
                                    'location': window.location.href,
                                    'action': 'replaying'
                                }
                            }
                        );
                    }
                }
                document.getElementById("play-icon").classList.remove("fade-in");
                p.song.play();
                if (typeof window.dataLayer !== typeof undefined && !p.hasStarted){
                    window.dataLayer.push(
                        { 
                            'event': 'play-animation',
                            'animation': {
                                'title': document.title,
                                'location': window.location.href,
                                'action': 'start playing'
                            }
                        }
                    );
                }
            }
        }
    }

    p.loadMidi = () => {
        // Load and parse the MIDI file
        Midi.fromUrl(midi).then((result) => {
            console.log('MIDI loaded:', result);
            // const track2 = result.tracks[17].notes;
            // p.scheduleCueSet(track2, 'executeTrack1');
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

    // Add the flower drawing callback to respond to MIDI cues
    p.executeTrack1 = (note) => {
        // This function will be called based on MIDI cues
        p.flowerPointer.grow = true;
    };
};

export default SnowflakesNo1;