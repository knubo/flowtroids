let app;
let ship;
let shipLocation = [0, 0, 0];

var otherShips = {};

var particles = [];
let particlesGraphics;
let bulletCount = 0;
let mapGraphics;
let gravity = 0.1;
let bulletLife = 250;

var connections = [];
var peer;

var gameStopped;

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
    sprite.fuel = 9999999;
    return sprite;
}


function drawOtherShip(data) {
    let parts = data.split(",");

    let command = parts.shift();

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

    if (command == "P" || command == "B") {
        particles.push({
            "x": parseFloat(parts[0]),
            "y": parseFloat(parts[1]),
            "vx": parseFloat(parts[2]),
            "vy": parseFloat(parts[3]),
	    "b" : command == "B" ? 1 : 0,
            "c": command == "B" ? bulletLife : 40
        });
        return;
    }

    if(command == "E") {
        let sprite = otherShips[parts[0]];

	if(sprite) {
            sprite.visible = false;
	}
 	
	for (let i = 0; i < 100; i++) {
          var items = {
            "x": parseFloat(parts[1]),
            "y": parseFloat(parts[2]),
            "vx": (Math.random() * 5) - 2.5,
            "vy": (Math.random() * 5) - 2.5,
            "c": Math.random() * 100
           };
            particles.push(items);
        }
        return;
    }

    let sprite = otherShips[parts[0]];

    if (!sprite) {
        sprite = makeShip(0xFF0000);
        otherShips[parts[0]] = sprite;

        app.stage.addChild(sprite);
    }

    sprite.visible = true;
    sprite.acutalX = parseFloat(parts[1]);
    sprite.actualY = parseFloat(parts[2]);

    sprite.x = (sprite.acutalX - shipLocation[0]);
    sprite.y = (sprite.actualY - shipLocation[1]);

    sprite.rotation = parseFloat(parts[3]);
}


function respawn() {
    ship.vx = 0;
    ship.vy = 0;
    ship.rotation = 0;
    ship.visible = true;
    shipLocation = randomOpenLocation();

    if (shipMaxFuel > 0) {
        ship.fuel = shipMaxFuel;
    }
}

function game() {

    app = new PIXI.Application({width: window.innerWidth - 20, height: window.innerHeight - 20});

    document.body.appendChild(app.view);
    window.addEventListener("resize", function () {
        app.renderer.resize(window.innerWidth - 20, window.innerHeight - 20);

    });

    ship = makeShip(0xFFFFFF);

    particlesGraphics = new PIXI.Graphics();

    ship.x = Math.floor(window.innerWidth / 2);
    ship.y = Math.floor(window.innerHeight / 2);
    respawn();

    app.stage.addChild(ship);
    app.stage.addChild(particlesGraphics);


    app.ticker.add(delta => gameLoop(delta));

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    document.getElementById("connect").style.visibility = "hidden";

    connect(null);

    mapGraphics = new PIXI.Graphics();
    app.stage.addChild(mapGraphics);

}

function connectWithId(connid) {

    if (getParam("master")) {
        console.log("Master - don't connect");
        return;
    }

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

    let connid = getParam("peerid");

    if (!connid) {
        connid = document.getElementById("peerid").value;
    }


    if (connid) {
        connectWithId(connid);
    }

    peer.on('open', function (id) {
        document.getElementById("mypeerid").innerHTML = id;
        console.log("Connected with:" + id);

        if (window.location.search.indexOf("peerid") == -1) {
            window.history.pushState("peerId", "Title", window.location + "?peerid=" + id + "&master=true");
        }

    });

/*
    peer.on('error', function (err) {
        if (peer) {
            peer.destroy();
        }
        connect(null);
    });
*/
    peer.on('connection', function (c) {
        console.log("Connect on peer " + c.id);


        connections.push(c);

        broadcastConnections();

        c.on('data', function (data) {
            drawOtherShip(data);
        });
    });
}

function addBullet() {
    if (bulletCount > shipMaxBullets) {
        return;
    }
    bulletCount++;

    let vx = Math.cos(ship.rotation - 1.57075);
    let vy = Math.sin(ship.rotation - 1.57075);
    var x = shipLocation[0] + vx * 10 + window.innerWidth / 2;
    var y = shipLocation[1] + vy * 15 + window.innerHeight / 2;

    var speed = 12;

    var items = {"x": x, "y": y, "vx": vx * speed, "vy": vy * speed, "c": bulletLife, "b": 1};
    particles.push(items);

    connections.forEach(function (conn) {
        conn.send("B," + x + "," + y + "," + (vx * speed) + "," + (vy*speed));
    });
}


function addParticles() {
    let vx = Math.cos(ship.rotation + 1.57075);
    let vy = Math.sin(ship.rotation + 1.57075);

    for (let i = 0; i < 5; i++) {
        let randx = 1 - (Math.random() * 2);
        let randy = 1 - (Math.random() * 2);

        var x = shipLocation[0] - ship.vx + randx;
        var y = shipLocation[1] - ship.vy + randy;
        var vx2 = ship.vx + 3 * vx + randx;
        var vy2 = ship.vy + 3 * vy + randy;
        var items = {"x": x + (window.innerWidth / 2), "y": (y + window.innerHeight / 2), "vx": vx2, "vy": vy2, "c": 40};
        particles.push(items);

        connections.forEach(function (conn) {
            conn.send("P," + (x+ window.innerWidth / 2) + "," + (y+window.innerHeight / 2) + "," + vx2 + "," + vy2);
        });
    }
}

let dx;

function gameLoop(delta) {
    dx += delta;

        if (dx < 1.1) {
            return;
        }


    dx = 0;


    if (!gameStopped) {

        shipLocation[0] = shipLocation[0] + ship.vx;
        shipLocation[1] = shipLocation[1] + ship.vy;


        ship.vx = ship.vx - findBreak(ship.vx / 50);
        ship.vy = ship.vy - findBreak(ship.vy / 50);

        ship.vy = ship.vy + gravity;

        ship.rotation += ship.vrotate;

	if(ship.speed) {
            ship.fuel = ship.fuel - 0.1;
	}

        if (ship.rotation < 0) {
            ship.rotation += 3.14156 * 2;
        }
        if (ship.rotation > 3.14156 * 2) {
            ship.rotation -= 3.14156 * 2;
        }

        if (shipLocation[0] < 0) {
            shipLocation[0] = 30 * 100;
        }

        shipLocation[2] = ship.rotation;

        if (shipLocation[0] > 30 * 100) {
            shipLocation[0] = 0;
        }

        if (shipLocation[1] < 0) {
            shipLocation[1] = 30 * 100;
        }
        if (shipLocation[1] > 30 * 100) {
            shipLocation[1] = 0;
        }

        if (ship.speed && ship.fuel > 0) {
            ship.vx = ship.vx + Math.cos(ship.rotation - 1.57075);
            ship.vy = ship.vy + Math.sin(ship.rotation - 1.57075);
            addParticles();
        }
    }


    animatePixels();
    drawOtherShips();

    if (!gameStopped && (Math.abs(ship.vx) > 0.1 || Math.abs(ship.vy) > 0.1 || ship.speed)) {
        connections.forEach(function (conn) {
            conn.send("S," + peer.id + "," + (shipLocation[0] + window.innerWidth / 2) + "," + (shipLocation[1] + window.innerHeight / 2) + "," + ship.rotation);
        });
    }


    if (!gameStopped) {
        mapGraphics.clear();
        let crash = drawMap(mapGraphics, shipLocation, particles);

        if (ship.fuel > 999999) {
            ship.fuel = shipMaxFuel;
        }

        if (crash > 0) {
            gameStopped = new Date();
            addExplodingShip();
        }
        if (crash == -1) {
            ship.vx = -0;
            ship.vy = -0.1;
            ship.fuel += 1;
            if (ship.fuel > shipMaxFuel) {
                ship.fuel = shipMaxFuel;
            }
        }

    }

    mapGraphics.beginFill(0xDDDDDD);
    mapGraphics.drawRect(window.innerWidth - 40, 10, 20, 100);
    mapGraphics.endFill();

    mapGraphics.beginFill(0x0000EE);
    mapGraphics.drawRect(window.innerWidth - 38, 108, 18, -((ship.fuel / shipMaxFuel) * 98));
    mapGraphics.endFill();


}

function addExplodingShip() {
    var x = shipLocation[0] + window.innerWidth / 2; 
    var y = shipLocation[1] + window.innerHeight / 2;

    ship.visible = false;
    for (let i = 0; i < 100; i++) {
        var items = {
            "x": x,
            "y": y,
            "vx": (Math.random() * 5) - 2.5,
            "vy": (Math.random() * 5) - 2.5,
            "c": Math.random() * 100
        };
        particles.push(items);
    }

    connections.forEach(function (conn) {
	conn.send("E," + peer.id + "," + (shipLocation[0] + window.innerWidth / 2) + "," + (shipLocation[1] + window.innerHeight / 2));
    });

}

function drawOtherShips() {
    let ships = Object.values(otherShips);

    ships.forEach(function (sprite) {
        sprite.x = (sprite.acutalX - shipLocation[0]);
        sprite.y = (sprite.actualY - shipLocation[1]);

    });
}

function animatePixels() {
    particlesGraphics.clear();

    particles.forEach(function (p) {
        p.x += p.vx;
        p.y += p.vy;
        p.c -= 1;

        if (!p.b) {
            p.vx = p.vx - findBreak(p.vx / 50);
            p.vy = p.vy - findBreak(p.vy / 50);
        } else {
            p.vy = p.vy + 0.1;
        }

        let c = p.c < 7 ? 0.3 : 1;
        particlesGraphics.lineStyle(1, p.b ? 0xFFFFFF : PIXI.utils.rgb2hex([c, c, c]), 1);

        let drawX = (p.x - shipLocation[0]);
        let drawY = (p.y - shipLocation[1]);

        particlesGraphics.moveTo(drawX, drawY);

        particlesGraphics.lineTo(drawX + (p.b ? 2 : 1), drawY + (p.b ? 2 : 1));
    });
    bulletCount = 0;
    particles = particles.filter(function (p) {
        if (p.b && p.c > 0) {
            bulletCount++;
        }
        return p.c > 0;
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
    if (gameStopped) {
        if (new Date().getTime() - gameStopped.getTime() > 5000) {
            gameStopped = null;
            respawn();
        }
        return;
    }


    if (key.keyCode === 65 || key.keyCode === 37) {
        ship.vrotate = -0.2;
    }

    if (key.keyCode === 68 || key.keyCode === 39) {
        ship.vrotate = 0.2;
    }

    if (key.keyCode === 87 || key.keyCode === 38) {
        ship.speed = 1;
    }

    if (key.keyCode === 32) {
        addBullet();
    }
    //console.log(key.keyCode);
    if (key.keyCode === 9) {
        if (document.getElementById("connect").style.visibility === "hidden") {
            document.getElementById("connect").style.visibility = "visible";
        } else {
            document.getElementById("connect").style.visibility = "hidden";
        }
    }

}

