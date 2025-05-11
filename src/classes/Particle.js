export default class Particle {
    constructor(p, tempStage, flake, x, y) {
        this.p = p;
        this.tempStage = tempStage;
        this.flake = flake;
        this.pos = this.p.createVector(x, y);
        this.r = 1;
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
        this.tempStage.point(this.pos.x, this.pos.y);
    }
 
    finished() {
        return (this.pos.x < 1);
    }
 
    intersects() {
        let result = false;
        for (let i of this.flake) {
            let d = this.p.dist(i.pos.x, i.pos.y, this.pos.x, this.pos.y);
            if (d < this.r * 2) {
                result = true;
                break;
            }
        }
        return result;
    }
}