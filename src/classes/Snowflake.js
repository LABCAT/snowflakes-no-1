import Particle from './Particle.js';  

export default class Snowflake {
    constructor(p, x = p.random(0, p.width), y = p.random(0, p.height)) {
        this.p = p;

        // Set base snowflake size as a percentage of screen width or height
        const screenMinDimension = Math.min(p.width, p.height); // Use the smallest dimension of the screen
        this.baseSize = screenMinDimension * 0.2;
        this.size = this.baseSize * p.random(0.5, 2);

        this.flakeimg = this.setStg();

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
        this.holspd = this.p.random(-0.001, 0.001);
        this.holnoise = this.p.random(0, 2000);
    }

    setStg() {
        let current;
        const flake = [];
        const tempStage = this.p.createGraphics(100, 100);
        tempStage.colorMode(this.p.HSB);
        tempStage.translate(tempStage.width / 2, tempStage.height / 2);
        tempStage.rotate(this.p.PI / 6);
        tempStage.noFill();
        tempStage.strokeWeight(this.p.random(1, 3));
        let isFinish = false;
        while (!isFinish) {
           
            current = new Particle(this.p, tempStage, flake, tempStage.width / 2, this.p.random(2));
            while (!current.finished() && !current.intersects()) {
                current.update();
            }
            flake.push(current);
            if (current.pos.x >= tempStage.width / 2) {
                
                for (let j = 0; j < 6; j++) {
                    tempStage.stroke(this.p.random(0, 360), 60, this.p.random(60, 100), 0.6);
                    tempStage.rotate(this.p.PI / 3);
                    for (let i of flake) {
                        i.show();
                    }
                    tempStage.push();
                    tempStage.scale(1, -1);
                    for (let i of flake) {
                        
                        i.show();
                    }
                    tempStage.pop();
                }
                isFinish = true;
            }
        }
        return tempStage;
    }

    update() {
        // Adjust snowflake size to be based on screen dimensions (e.g., width or height)
        const snowflakeSize = this.size;


        // Apply noise for the holspd
        this.holspd += (this.p.noise(this.holnoise) - 0.5) / 200;
        this.holnoise += 0.002;
    }

    draw() {
        this.p.push();
        this.p.translate(this.loc.x, this.loc.y);
        this.p.rotate(this.p.frameCount / this.rotspd);
        this.p.image(this.flakeimg, -this.size / 2, -this.size / 2, this.size, this.size); // Use dynamic size here
        this.p.pop();
    }
}
