import Particle from './Particle.js';  

export default class Snowflake {
    constructor(p, x = p.random(0, p.width), y = p.random(0, p.height), duration) {
        this.p = p;

        // Set base snowflake size as a percentage of screen width or height
        const screenMinDimension = Math.min(p.width, p.height); // Use the smallest dimension of the screen
        this.baseSize = screenMinDimension * 0.2;
        // this.size = this.baseSize * p.random(0.5, 2);
        this.size = this.baseSize;

        // Create the buffer in the constructor
        this.buffer = this.p.createGraphics(100, 100);
        this.buffer.colorMode(this.p.HSB);
        this.buffer.translate(this.buffer.width / 2, this.buffer.height / 2);
        this.buffer.rotate(this.p.PI / 6);
        this.buffer.noFill();

        this.generateParticles();

        // Ensure x, y are within the screen bounds
        this.loc = this.p.createVector(
            this.p.constrain(x, 0, this.p.width), 
            this.p.constrain(y, 0, this.p.height)
        );

        this.spd = this.p.random(0.3, 1.5);
        this.rotspd = this.p.random(30, 150);
        if (Math.random() < 0.5) { 
            this.rotspd *= -1; 
        }
        this.duration = duration * 1000;
        this.birthTime = p.song.currentTime() * 1000;
        this.reversed = false;
    }

     generateParticles() {
        const flake1 = [];
        const flake2 = [];

        // Helper function to generate a batch
        const generateBatch = (flakeArray, strokeWeight, strokeColor) => {
        let isFinish = false;
        while (!isFinish) {
            let current = new Particle(
            this.p,
            this.buffer,
            flakeArray,
            this.buffer.width / 2,
            this.p.random(2),
            strokeWeight,
            strokeColor
            );
            while (!current.finished() && !current.intersects()) {
            current.update();
            }
            flakeArray.push(current);
            if (current.pos.x >= this.buffer.width / 2) {
            isFinish = true;
            }
        }
        };

        generateBatch(flake1, 2, [0, 0, 100, 0.8]); // white particles
        // colored particles
        generateBatch(
            flake2, 
            1, 
            [
                this.p.random(0, 360),
                100,
                100,
                1,
            ]
        );
            
        this.flake1 = flake1;
        this.flake2 = flake2;
    }



    update() {
        const currentTime = this.p.song.currentTime() * 1000;
        const elapsed = currentTime - this.birthTime;
        const rawProgress = elapsed / this.duration;

        this.progress = this.p.constrain(
            this.reversed ? 1 - rawProgress : rawProgress,
            0,
            1
        );

        this.drawToBuffer(this.progress);
    }

    drawToBuffer(progress) {
        this.buffer.clear();
        // Calculate how many particles to show based on progress (index limit)
        const count1 = Math.floor(this.flake1.length * progress);
        const count2 = Math.floor(this.flake2.length * progress);
        for (let j = 0; j < 6; j++) {
            this.buffer.rotate(this.p.PI / 3);

            // Draw partial flake1
            for (let i = 0; i < count1; i++) {
                this.flake1[i].show();
            }

            this.buffer.push();
            this.buffer.scale(1, -1);
            for (let i = 0; i < count1; i++) {
                this.flake1[i].show();
            }
            this.buffer.pop();
        }

        for (let j = 0; j < 6; j++) {
            this.buffer.rotate(this.p.PI / 3);

            // Draw partial flake2
            for (let i = 0; i < count2; i++) {
                this.flake2[i].show();
            }

            this.buffer.push();
            this.buffer.scale(1, -1);
            for (let i = 0; i < count2; i++) {
                this.flake2[i].show();
            }
            this.buffer.pop();
        }
    }
    draw() {
        this.p.push();
        this.p.translate(this.loc.x, this.loc.y);
        this.p.rotate(this.p.frameCount / this.rotspd);
        this.p.image(this.buffer, -this.size / 2, -this.size / 2, this.size, this.size); // Use dynamic size here
        this.p.pop();
    }
}
