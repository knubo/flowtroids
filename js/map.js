var mapdata;
var rows;
let scale = 30;

var debugCrash = false;
var canvas;

function drawMap(g, trans) {

    if (!mapdata) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open("GET", "../maps/tournament2.map", false); // false for synchronous request
        xmlHttp.send(null);
        mapdata = xmlHttp.responseText;

        let regexp = RegExp('.*mapData:.*multiline: (.*)', 'gm');
        let match = regexp.exec(mapdata);
        let delimiter = match[1];

        let content = mapdata.split(delimiter)[1];

        rows = content.split("\n");

        rows.shift();
        rows.pop();
    }

    parseMapData(g, trans);
}


function makeShipPolygon(colSystem, px, py, rotation) {
    return colSystem.createPolygon(px + 10, py + 15,
        [ [0, -15],[-10, 5], [0,  0], [10,  5]],
        rotation);
}


function parseMapData(graphics, trans) {

    let rowT = Math.floor(trans[1] / scale);
    let colT = Math.floor(trans[0] / scale);
    let px = scale - (trans[0] % scale);
    let py = scale - (trans[1] % scale);

    let collision = false;

    let colSystem = document.collision();
    let shipPoly = makeShipPolygon(colSystem, window.innerWidth / 2, window.innerHeight / 2, trans[2]);
    
    graphics.lineStyle(1, 0xFFFFFF, 1);

    for (let row = -1; row < rows.length; row++) {

        let lRow = row + rowT;

        if (lRow < 0) {
            lRow += rows.length;
        }

        if (lRow >= rows.length) {
            lRow -= rows.length;
        }

        let colData = rows[lRow];

        for (let col = -1; col < colData.length; col++) {

            let lCol = col + colT;
            if (lCol >= colData.length) {
                lCol -= colData.length;
            }
            if (lCol < 0) {
                lCol += colData.length;
            }

            let c = colData.charAt(lCol);

            if (col * scale > window.innerWidth || row * scale > window.innerHeight) {
                continue;
            }

            graphics.lineStyle(1, 0xFFFFFF, 1);

            let testForCollision = false;


            if (px + col * scale > (window.innerWidth / 2) - scale*2 && px + col * scale < (window.innerWidth / 2) + scale &&
                py + row * scale > (window.innerHeight / 2) - scale*2 && py + row * scale < (window.innerHeight / 2) + scale) {
                testForCollision = true;

                graphics.lineStyle(1, 0x00FF00, 1);

            }

            switch (c) {
                case 'x':
                    if (testForCollision) {
                        colSystem.createPolygon(px + col * scale, py + row * scale, [ [0, 0], [scale, 0], [scale, scale], [0, scale]]);
                    }
                    graphics.drawRect(px + col * scale, py + row * scale, scale, scale);
                    break;
                case 'a':
                    let t = [px + col * scale, py + row * scale, px + col * scale + scale, py + row * scale, px + col * scale + scale, py + row * scale + scale, px + col * scale, py + row * scale];
                    if (testForCollision) {

//                        collision = SAT.testPolygonPolygon(shipPolygon, toSATPolygon(t), satResponse);
                        if (collision) graphics.lineStyle(1, 0xFF0000, 1);
                    }
                    graphics.drawPolygon(t);
                    break;
                case 'q':
                    let t2 = [px + col * scale + scale, py + row * scale, px + col * scale + scale, py + row * scale + scale, px + col * scale, py + row * scale + scale, px + col * scale + scale, py + row * scale];
                    if (testForCollision) {
//                        collision = SAT.testPolygonPolygon(shipPolygon, toSATPolygon(t2), satResponse);
                        if (collision) graphics.lineStyle(1, 0xFF0000, 1);
                    }
                    graphics.drawPolygon(t2);
                    break;
                case 's':
                    var t3 = [px + col * scale, py + row * scale, px + col * scale + scale, py + row * scale, px + col * scale, py + row * scale + scale, px + col * scale, py + row * scale];
                    if (testForCollision) {
//                        collision = SAT.testPolygonPolygon(shipPolygon, toSATPolygon(t3), satResponse);
                        if (collision) graphics.lineStyle(1, 0xFF0000, 1);
                    }
                    graphics.drawPolygon(t3);
                    break;
                case 'w':
                    var t4 = [px + col * scale, py + row * scale, px + col * scale + scale, py + row * scale + scale, px + col * scale, py + row * scale + scale, px + col * scale, py + row * scale];
                    if (testForCollision) {
//                        collision = SAT.testPolygonPolygon(shipPolygon, toSATPolygon(t4), satResponse);
                        if (collision) graphics.lineStyle(1, 0xFF0000, 1);
                    }
                    graphics.drawPolygon(t4);
                    break;
                case '#':
                    if (testForCollision) {
//                        collision = SAT.testPolygonPolygon(shipPolygon, new SAT.Box(new SAT.Vector(px + col * scale, py + row * scale), scale, scale).toPolygon(), satResponse);
                        if (collision) graphics.lineStyle(1, 0xFF0000, 1);
                    }
                    graphics.beginFill(0x1111FF);
                    graphics.drawRect(px + col * scale, py + row * scale, scale, scale);
                    graphics.endFill();
                    break;
                case '_':
                    graphics.lineStyle(1, 0x11EE11, 1);
                    graphics.beginFill(0x11EE11);
                    graphics.drawRect(px + col * scale, py + row * scale + scale - 2, scale, 2);
                    graphics.endFill();
                    graphics.lineStyle(1, 0xFFFFFF, 1);
                    break;

            }
        }
    }
    const potentials = shipPoly.potentials();
    const result = colSystem.createResult();
    
    for(const wall of potentials) {
	if(shipPoly.collides(wall, result)) {
            console.log("crash");
	}
    }

    if(debugCrash) {
	if(!canvas) {
	   canvas  = document.createElement('canvas');
    	    document.body.appendChild(canvas);

	    canvas.width  = window.innerWidth;
            canvas.height = window.innerHeight;
	}
       const context = canvas.getContext('2d');
       context.clearRect(0, 0, canvas.width, canvas.height);

       context.strokeStyle = '#FFFFFF';
       context.rect(120, 120, 130, 130);
       context.fill();

       context.beginPath();
       colSystem.draw(context);
       context.stroke();
    }
    return collision;
}
