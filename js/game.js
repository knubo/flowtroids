let app;
let ship;

var otherShips = {};

var particles = [];
let particlesGraphics;

var conn = null;
var peerId = null;

function makeShip(color) {

    let ship = new PIXI.Graphics();

    ship.lineStyle(1, color, 1);
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


function drawOtherShip(data) {
    let parts = data.split(",");

    if(parts[0] == "P") {
        particles.push({"x": parseFloat(parts[1]), "y": parseFloat(parts[2]), "vx": parseFloat(parts[3]), "vy": parseFloat(parts[4]), "c" : 40});
        return;
    }

    let sprite = otherShips[parts[1]];

    if(!sprite) {
        sprite = makeShip(0xFF0000);
        otherShips[parts[1]] = sprite;

        app.stage.addChild(sprite);
    }

    sprite.x = parseFloat(parts[2]);
    sprite.y = parseFloat(parts[3]);
    sprite.rotation = parseFloat(parts[4]);
}


function game() {

    app = new PIXI.Application({width: window.innerWidth-20, height: window.innerHeight-20});

    document.body.appendChild(app.view);
    window.addEventListener("resize", function() {
        app.renderer.resize(window.innerWidth-20, window.innerHeight-20);
    });

    ship = makeShip(0xFFFFFF);

    particlesGraphics = new PIXI.Graphics();

    ship.x = 100;
    ship.y = 100;

    app.stage.addChild(ship);
    app.stage.addChild(particlesGraphics);

    app.ticker.add(delta => gameLoop(delta));

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    document.getElementById("connect").style.visibility = "hidden";
}

function connect() {
    let peer = new Peer(null);

    console.log("Pre connect");
   // conn = peer.connect("knubo-flowtroids");

    console.log("Connect called");

    peer.on('open', function(id) {
        peerId = id;
        document.getElementById("mypeerid").innerHTML = id;
        console.log("Connected with:"+id);
    });

    let connid = document.getElementById("peerid").value;

    if(connid) {
        conn = peer.connect(connid);

        conn.on('data', function(data) {
           drawOtherShip(data);
        });
    }

    peer.on('connection', function(c) {
        console.log("Connect on peer "+c);
        conn = c;
        conn.on('data', function(data) {
            drawOtherShip(data);
        });
    });
}

function addParticles() {
    let vx = Math.cos(ship.rotation + 1.57075);
    let vy = Math.sin(ship.rotation + 1.57075);

    for(let i = 0; i < 5; i++) {
        let randx = 1 - (Math.random() * 2);
        let randy = 1 - (Math.random() * 2);

        var x = ship.x - ship.vx + randx;
        var y = ship.y - ship.vy + randy;
        var vx2 = ship.vx + 3 * vx + randx;
        var vy2 = ship.vy + 3 * vy + randy;
        particles.push({"x": x, "y": y, "vx": vx2, "vy": vy2, "c": 40});

        if (conn) {
            conn.send("P," + x + "," + y + "," + vx2 + "," + vy2);
        }
    }
}

function gameLoop(delta) {
    ship.x = ship.x + ship.vx;
    ship.y = ship.y + ship.vy;

    ship.vx = ship.vx - findBreak(ship.vx / 50);
    ship.vy = ship.vy - findBreak(ship.vy / 50);

    ship.rotation += ship.vrotate;

    if(ship.x < 0) {
        ship.x = window.innerWidth;
    }

    if(ship.x > window.innerWidth) {
        ship.x = 0;
    }

    if(ship.y < 0) {
        ship.y = window.innerHeight;
    }
    if(ship.y > window.innerHeight) {
        ship.y = 0;
    }

    if(ship.speed) {
        ship.vx = ship.vx + Math.cos(ship.rotation - 1.57075);
        ship.vy = ship.vy + Math.sin(ship.rotation - 1.57075);
        addParticles();
    }

    animatePixels();

    if(conn) {
        conn.send("S,"+peerId+","+ship.x+","+ship.y+","+ship.rotation);
    }
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

//    console.log(key.keyCode);
    if(key.keyCode === 9) {
        if(document.getElementById("connect").style.visibility === "hidden") {
            document.getElementById("connect").style.visibility = "visible";
        } else {
            document.getElementById("connect").style.visibility = "hidden";
        }
    }
}