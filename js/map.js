var mapdata;
var rows;
let scale = 30;

var debugCrash = false;
var canvas;

var shipMaxFuel;

var BX = window.innerWidth / 2;
var BY = window.innerHeight / 2;

function drawMap(g, trans, particles) {

    if (!mapdata) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open("GET", "../maps/tournament2.map", false); // false for synchronous request
        xmlHttp.send(null);
        mapdata = xmlHttp.responseText;

        let fuelMatch = mapdata.match("initialfuel:(.*)");

	shipMaxFuel = fuelMatch[1];
	
        let regexp = RegExp('.*mapData:.*multiline: (.*)', 'gm');
        let match = regexp.exec(mapdata);
        let delimiter = match[1];

        let content = mapdata.split(delimiter)[1];

        rows = content.split("\n");

        rows.shift();
        rows.pop();
    }

    return parseMapData(g, trans, particles);
}


function makeShipPolygon(colSystem, px, py, rotation) {
    return colSystem.createPolygon(px, py,
        [ [0, -15],[-10, 5], [0,  0], [10,  5]],
        rotation);
}


function parseMapData(graphics, trans, particles) {

    let rowT = Math.floor(trans[1] / scale);
    let colT = Math.floor(trans[0] / scale);
    let px = scale - (trans[0] % scale);
    let py = scale - (trans[1] % scale);

    let collision = false;

    let colSystem = document.collision();
    let shipPoly = makeShipPolygon(colSystem, window.innerWidth / 2, window.innerHeight / 2, trans[2]);
    
    graphics.lineStyle(1, 0xFFFFFF, 1);


    let greens = {};
    particles.forEach(function (p) {       	
	let rowP = Math.floor( (p.y + (window.innerHeight / 2)) / scale);
        let colP = Math.floor( (p.x + (window.innerWidth / 2)) / scale);

        if(rowP > rows.length) {
            rowP -= rows.length;
	}
	if(rowP < 0) {
	    rowP += rows.length;
	}
	
	if(colP > rows[0].length) {
            colP -= rows[0].length;
	}
        if(colP < 0) {
            colP += rows[0].length;
	}
	
	if(rows[rowP] && colP > 0 && rows[rowP].charAt(colP) != ' ' && p.c > 3) {
    	    greens[rowP+"-"+colP] = 1;
	    p.c = 3;
	}

	if(p.b) {
            //TODO bullet collision
            //colSystem.createPolygon(bx, by, [[0,0], [1,0], [1,1], [0,1]]);
	}

    });

    
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

            if(greens[lRow+"-"+lCol]) {
//                graphics.lineStyle(1, 0xFF00FF, 1);
	    }
	    
            let testForCollision = false;


            if (px + col * scale > (window.innerWidth / 2) - scale*2 && px + col * scale < (window.innerWidth / 2) + scale &&
                py + row * scale > (window.innerHeight / 2) - scale*2 && py + row * scale < (window.innerHeight / 2) + scale) {
                testForCollision = true;
            }

            switch (c) {
                case 'x':
                    if (testForCollision) {
                        colSystem.createPolygon(px + col * scale, py + row * scale, [ [0, 0], [scale, 0], [scale, scale], [0, scale]]);
                    }
                    graphics.drawRect(px + col * scale, py + row * scale, scale, scale);
                    break;
                case 'a':
                    if (testForCollision) {
                        colSystem.createPolygon(px + col * scale, py + row * scale, [ [0,0], [scale, 0], [scale,scale] ]);
                    }
                    graphics.drawPolygon([px + col * scale, py + row * scale, px + col * scale + scale, py + row * scale, px + col * scale + scale, py + row * scale + scale, px + col * scale, py + row * scale]);
                    break;
                case 'q':
                    if (testForCollision) {
                        colSystem.createPolygon(px + col * scale + scale, py + row * scale, [ [scale,0], [scale,scale], [0,scale] ]);
                    }
                    graphics.drawPolygon([px + col * scale + scale, py + row * scale, px + col * scale + scale, py + row * scale + scale, px + col * scale, py + row * scale + scale, px + col * scale + scale, py + row * scale]);
                    break;
                case 's': // 
                    if (testForCollision) {
                        colSystem.createPolygon(px + col * scale, py + row * scale, [ [0,0], [scale, 0], [0, scale] ]);
                    }
                    graphics.drawPolygon([px + col * scale, py + row * scale, px + col * scale + scale, py + row * scale, px + col * scale, py + row * scale + scale, px + col * scale, py + row * scale]);
                    break;
                case 'w':
                    if (testForCollision) {
                        colSystem.createPolygon(px + col * scale, py + row * scale, [ [0,0], [scale,scale], [0, scale] ]);
                    }
                    graphics.drawPolygon([px + col * scale, py + row * scale, px + col * scale + scale, py + row * scale + scale, px + col * scale, py + row * scale + scale, px + col * scale, py + row * scale]);
                    break;
                case '#':
                    if (testForCollision) {
                        colSystem.createPolygon(px + col * scale, py + row * scale, [ [0, 0], [scale, 0], [scale, scale], [0, scale]]);
                    }
                    graphics.beginFill(0x1111FF);
                    graphics.drawRect(px + col * scale, py + row * scale, scale, scale);
                    graphics.endFill();
                    break;
                case '_':
                    if (testForCollision) {
                        let platform = colSystem.createPolygon(px + col * scale, py + row * scale, [ [0, scale], [scale, scale], [scale,scale-2], [0, scale-2]]);
			platform.isAPlatform = true;
                    }
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
  	    collision=wall.isAPlatform ? -1 : 1;
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
