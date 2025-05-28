export default class Particle {
    constructor(p, tempStage, flake, x, y, strokeWeight = 1, strokeColor = [0, 0, 100, 1]) {
        this.p = p;
        this.tempStage = tempStage;
        this.flake = flake;
        this.pos = this.p.createVector(x, y);
        this.r = 1;
        this.strokeWeight = strokeWeight;
        this.strokeColor = strokeColor; // HSB array: [h, s, b, alpha]
    }
 
    update() {
        this.pos.x -= 1;
        this.pos.y += this.p.random(-3, 3);
        let angle = this.pos.heading();
        angle = this.p.constrain(angle, 0, this.p.PI / 6);
        let magnitude = this.pos.mag();
        this.pos = p5.Vector.fromAngle(angle);
        this.pos.setMag(magnitude);
    }
 
    show() {
        this.tempStage.strokeWeight(this.strokeWeight);
        this.tempStage.stroke(...this.strokeColor);
        this.tempStage.point(this.pos.x, this.pos.y);
    }
 
    finished() {
        return (this.pos.x < 1);
    }
 
    intersects() {
        for (let i of this.flake) {
            let d = this.p.dist(i.pos.x, i.pos.y, this.pos.x, this.pos.y);
            if (d < this.r * 2) {
                return true;
            }
        }
        return false;
    }
}
