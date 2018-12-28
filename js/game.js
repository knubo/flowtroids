let app;
let ship;

var otherShips = {};

var particles = [];
let particlesGraphics;

var connections = [];
var peer;

function makeShip(color) {

    let ship = new PIXI.Graphics();

    ship.lineStyle(1, color, 1);
    ship.moveTo(10, 0);
    ship.lineTo(0, 20);
    ship.lineTo(10, 15);
    ship.lineTo(20, 20);
    ship.lineTo(10, 0);

    let texture = ship.generateCanvasTexture();
    let sprite = new PIXI.Sprite(texture);
    sprite.pivot = new PIXI.Point(10, 15);

    sprite.vx = 0;
    sprite.vy = 0;
    sprite.vrotate = 0;
    sprite.speed = 0;
    return sprite;
}


function drawOtherShip(data) {
    let parts = data.split(",");

    let command = parts.shift();

    if (command == "P") {
        particles.push({
            "x": parseFloat(parts[0]),
            "y": parseFloat(parts[1]),
            "vx": parseFloat(parts[2]),
            "vy": parseFloat(parts[3]),
            "c": 40
        });
        return;
    }

    if (command == "C") {
        console.log("Connections seen:" + data);
        let foundMissingCon = false;

        parts.forEach(function (id) {
            if (!peer.connections[id] && id != peer.id) {
                console.log("Connecting also to " + id + " as different than " + peer.id);
                connectWithId(id);
                foundMissingCon = true;
            }
        });

        if (foundMissingCon) {
            broadcastConnections();
        }

        return;
    }


    let sprite = otherShips[parts[0]];

    if (!sprite) {
        sprite = makeShip(0xFF0000);
        otherShips[parts[0]] = sprite;

        app.stage.addChild(sprite);
    }

    sprite.x = parseFloat(parts[1]);
    sprite.y = parseFloat(parts[2]);
    sprite.rotation = parseFloat(parts[3]);
}


function game() {

    app = new PIXI.Application({width: window.innerWidth - 20, height: window.innerHeight - 20});

    document.body.appendChild(app.view);
    window.addEventListener("resize", function () {
        app.renderer.resize(window.innerWidth - 20, window.innerHeight - 20);
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

    connect(null);
}

function connectWithId(connid) {
    console.log("Opening to " + connid);
    let conn = peer.connect(connid);

    connections.push(conn);

    conn.on('data', function (data) {
        drawOtherShip(data);
    });
}

function broadcastConnections() {

    let ids = Object.keys(peer.connections).join(",");

    connections.forEach(function (c) {
        c.send("C," + ids + "," + peer.id);
    });
}

function getParam(name) {
    if (name = (new RegExp('[?&]' + encodeURIComponent(name) + '=([^&]*)')).exec(location.search))
        return decodeURIComponent(name[1]);
}


function connect(peerId) {
    peer = new Peer(peerId);

    console.log("Pre connect");


    peer.on('open', function (id) {
        document.getElementById("mypeerid").innerHTML = id;
        console.log("Connected with:" + id);

        window.history.pushState("peerId", "Title", window.location + "?peerid=" + id);

    });

    let connid = getParam("peerid");

    if (!connid) {
        connid = document.getElementById("peerid").value;
    }

    if (connid) {
        connectWithId(connid);
    }


    peer.on('error', function (err) {
        if (peer) {
            peer.destroy();
        }
        connect(null);
    });

    peer.on('connection', function (c) {
        console.log("Connect on peer " + c.id);


        connections.push(c);

        broadcastConnections();

        c.on('data', function (data) {
            drawOtherShip(data);
        });
    });
}

function addParticles() {
    let vx = Math.cos(ship.rotation + 1.57075);
    let vy = Math.sin(ship.rotation + 1.57075);

    for (let i = 0; i < 5; i++) {
        let randx = 1 - (Math.random() * 2);
        let randy = 1 - (Math.random() * 2);

        var x = ship.x - ship.vx + randx;
        var y = ship.y - ship.vy + randy;
        var vx2 = ship.vx + 3 * vx + randx;
        var vy2 = ship.vy + 3 * vy + randy;
        var items = {"x": x, "y": y, "vx": vx2, "vy": vy2, "c": 40};
        particles.push(items);

        connections.forEach(function (conn) {
            conn.send("P," + x + "," + y + "," + vx2 + "," + vy2);
        });
    }
}

function gameLoop(delta) {
    ship.x = ship.x + ship.vx;
    ship.y = ship.y + ship.vy;

    ship.vx = ship.vx - findBreak(ship.vx / 50);
    ship.vy = ship.vy - findBreak(ship.vy / 50);

    ship.rotation += ship.vrotate;

    if (ship.x < 0) {
        ship.x = window.innerWidth;
    }

    if (ship.x > window.innerWidth) {
        ship.x = 0;
    }

    if (ship.y < 0) {
        ship.y = window.innerHeight;
    }
    if (ship.y > window.innerHeight) {
        ship.y = 0;
    }

    if (ship.speed) {
        ship.vx = ship.vx + Math.cos(ship.rotation - 1.57075);
        ship.vy = ship.vy + Math.sin(ship.rotation - 1.57075);
        addParticles();
    }

    animatePixels();

    if (Math.abs(ship.vx) > 0.1 || Math.abs(ship.vy) > 0.1 || ship.speed) {
        connections.forEach(function (conn) {
            conn.send("S," + peer.id + "," + ship.x + "," + ship.y + "," + ship.rotation);
        });
    }

}

function animatePixels() {
    particlesGraphics.clear();

    particles.forEach(function (p) {
        p.x += p.vx;
        p.y += p.vy;
        p.c -= 1;

        p.vx = p.vx - findBreak(p.vx / 50);
        p.vy = p.vy - findBreak(p.vy / 50);


        let c = p.c < 7 ? 0.3 : 1;
        particlesGraphics.lineStyle(1, PIXI.utils.rgb2hex([c, c, c]), 1);

        particlesGraphics.moveTo(p.x, p.y);
        particlesGraphics.lineTo(p.x + 1, p.y + 1);
    });
    particles = particles.filter(function (p) {
        return p.c > 0
    });

}

function findBreak(d) {
    if (d > 1) {
        return 1;
    }

    if (d < -1) {
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
    if (key.keyCode === 9) {
        if (document.getElementById("connect").style.visibility === "hidden") {
            document.getElementById("connect").style.visibility = "visible";
        } else {
            document.getElementById("connect").style.visibility = "hidden";
        }
    }
}