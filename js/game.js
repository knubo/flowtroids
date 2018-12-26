let app;
let ship;

var particles = [];
let particlesGraphics;

function makeShip() {

    let ship = new PIXI.Graphics();

    ship.lineStyle(1, 0xFFFFFF, 1);
    ship.moveTo(10, 0);
    ship.lineTo(0, 20);
    ship.lineTo(10,15);
    ship.lineTo(20,20);
    ship.lineTo(10, 0);

    let texture = ship.generateCanvasTexture();
    let sprite = new PIXI.Sprite(texture);
    sprite.pivot = new PIXI.Point (10,15);

    sprite.vx = 0;
    sprite.vy = 0;
    sprite.vrotate = 0;
    sprite.speed=0;
    return sprite;
}

function game() {

    app = new PIXI.Application({width: window.innerWidth-20, height: window.innerHeight-20});

    document.body.appendChild(app.view);
    window.addEventListener("resize", function() {
        app.renderer.resize(window.innerWidth-20, window.innerHeight-20);
    });

    ship = makeShip();

    particlesGraphics = new PIXI.Graphics();

    ship.x = 100;
    ship.y = 100;

    app.stage.addChild(ship);
    app.stage.addChild(particlesGraphics);

    app.ticker.add(delta => gameLoop(delta));

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
}

function addParticles() {
    let vx = Math.cos(ship.rotation + 1.57075);
    let vy = Math.sin(ship.rotation + 1.57075);

    for(let i = 0; i < 5; i++) {
        let randx = 1 - (Math.random() * 2);
        let randy = 1 - (Math.random() * 2);

        particles.push({"x":ship.x - ship.vx + randx, "y":ship.y - ship.vy + randy, "vx": ship.vx + 3 * vx + randx, "vy": ship.vy + 3 * vy + randy, "c" : 40});
    }
}

function gameLoop(delta) {
    ship.x = ship.x + ship.vx;
    ship.y = ship.y + ship.vy;

    ship.vx = ship.vx - findBreak(ship.vx / 50);
    ship.vy = ship.vy - findBreak(ship.vy / 50);

    ship.rotation += ship.vrotate;

    if(ship.speed) {
        ship.vx = ship.vx + Math.cos(ship.rotation - 1.57075);
        ship.vy = ship.vy + Math.sin(ship.rotation - 1.57075);
        addParticles();
    }

    animatePixels();
}

function animatePixels() {
    particlesGraphics.clear();


    particles.forEach(function(p) {
        p.x += p.vx;
        p.y += p.vy;
        p.c -= 1;

        p.vx = p.vx - findBreak(p.vx / 50);
        p.vy = p.vy - findBreak(p.vy / 50);


        let c = p.c < 7 ? 0.3 : 1;
        particlesGraphics.lineStyle(1, PIXI.utils.rgb2hex([c, c, c]), 1);

        particlesGraphics.moveTo(p.x, p.y);
        particlesGraphics.lineTo(p.x+1, p.y+1);
    });
    particles = particles.filter(function(p) {return p.c > 0});

}

function findBreak(d) {
    if(d > 1) {
        return 1;
    }

    if(d < -1) {
        return -1;
    }

    return d;
}

function onKeyUp(key) {
    if (key.keyCode === 65 || key.keyCode === 37) {
        ship.vrotate = 0;
    }

    if (key.keyCode === 68 || key.keyCode === 39) {
        ship.vrotate = 0;
    }

    if (key.keyCode === 87 || key.keyCode === 38) {
        ship.speed = 0;
    }
}

function onKeyDown(key) {
    if (key.keyCode === 65 || key.keyCode === 37) {
        ship.vrotate = -0.2;
    }

    if (key.keyCode === 68 || key.keyCode === 39) {
        ship.vrotate = 0.2;
    }

    if (key.keyCode === 87 || key.keyCode === 38) {
        ship.speed = 1;
    }
}