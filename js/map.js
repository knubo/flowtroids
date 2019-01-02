var mapdata;
var rows;
let scale = 30;



var debugCrash = false;
var canvas;

var shipMaxFuel;
var shipMaxBullets;


function init() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", "../maps/tournament2.map", false); // false for synchronous request
    xmlHttp.send(null);
    mapdata = xmlHttp.responseText;

    let fuelMatch = mapdata.match(/initialfuel.*:(.*)/);
    shipMaxFuel = fuelMatch[1].trim();

    let maxBullets = mapdata.match(/maxplayershots.*:(.*)/);
    shipMaxBullets = maxBullets[1].trim();

    let regexp = RegExp('.*mapData:.*multiline: (.*)', 'gm');
    let match = regexp.exec(mapdata);
    let delimiter = match[1];

    let content = mapdata.split(delimiter)[1];

    rows = content.split("\n");

    rows.shift();
    rows.pop();
}

function drawMap(g, trans, particles) {

    return parseMapData(g, trans, particles);
}

function randomOpenLocation() {
    if (!rows) {
        return [0, 0, 0];
    }

    var row = Math.floor(Math.random() * (rows.length) - 2) + 1;

    let rowData = rows[row];
    let col = Math.floor(Math.random() * (rowData.length - 2)) + 1;

    for (let i = row - 1; i < row + 1; i++) {
        rowData = rows[row];

        if (rowData.charAt(col) != ' ' && rowData.charAt(col - 1) != ' ' && rowData.charAt(col + 1) != ' ') {
            return randomOpenLocation();
        }
    }
    return [(col * scale) - window.innerWidth / 2, (row * scale) - window.innerHeight / 2, 0];

}

function makeShipPolygon(colSystem, px, py, rotation) {
    return colSystem.createPolygon(px, py,
        [[0, -15], [-10, 5], [0, 0], [10, 5]],
        rotation);
}

function adjust(n, m) {
    if (n > m) {
       n -= m;
    }
    if (n < 0) {
       n += m;
    }

    return n;
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

    let bullets = [];

    let greens = {};
    particles.forEach(function (p) {
        let rowP = Math.floor(p.y / scale);
        let colP = Math.floor(p.x / scale);

	rowP = adjust(rowP, rows.length);
        colP = adjust(colP, rows[0].length);

	if(p.c > 3) {
           for(let i = -1; i < 2; i++) {
               for(let j = -1; j < 2; j++) {

   		  let ycheck = adjust(rowP+i, rows.length);
		  let xcheck = adjust(colP+j, rows[0].length);

                  if (rows[ycheck] && rows[ycheck].charAt(xcheck) != ' ') {
		     greens[ycheck + "-" + xcheck] = 1;
		  }
	      }
          }
	}

        if (p.b) {
            let bullet = colSystem.createPolygon(p.x - trans[0], p.y - trans[1], [ [0,0], [1,0], [1,1], [0,1] ]);
	    bullet.isABullet = p;
	    bullets.push(bullet);
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


            let testForCollision = false;


            if (px + col * scale > (window.innerWidth / 2) - scale * 2 && px + col * scale < (window.innerWidth / 2) + scale &&
                py + row * scale > (window.innerHeight / 2) - scale * 2 && py + row * scale < (window.innerHeight / 2) + scale) {
                testForCollision = true;
            }

           if (greens[lRow + "-" + lCol]) {
               testForCollision = true;
            }


            switch (c) {
                case 'x':
                    if (testForCollision) {
                        colSystem.createPolygon(px + col * scale, py + row * scale, [[0, 0], [scale, 0], [scale, scale], [0, scale]]);
                    }
                    graphics.drawRect(px + col * scale, py + row * scale, scale, scale);
                    break;
                case 'a':
                    if (testForCollision) {
                        colSystem.createPolygon(px + col * scale, py + row * scale, [[0, 0], [scale, 0], [scale, scale]]);
                    }
                    graphics.drawPolygon([px + col * scale, py + row * scale, px + col * scale + scale, py + row * scale, px + col * scale + scale, py + row * scale + scale, px + col * scale, py + row * scale]);
                    break;
                case 'q':
                    if (testForCollision) {
                        colSystem.createPolygon(px + col * scale + scale, py + row * scale, [[scale, 0], [scale, scale], [0, scale]]);
                    }
                    graphics.drawPolygon([px + col * scale + scale, py + row * scale, px + col * scale + scale, py + row * scale + scale, px + col * scale, py + row * scale + scale, px + col * scale + scale, py + row * scale]);
                    break;
                case 's': // 
                    if (testForCollision) {
                        colSystem.createPolygon(px + col * scale, py + row * scale, [[0, 0], [scale, 0], [0, scale]]);
                    }
                    graphics.drawPolygon([px + col * scale, py + row * scale, px + col * scale + scale, py + row * scale, px + col * scale, py + row * scale + scale, px + col * scale, py + row * scale]);
                    break;
                case 'w':
                    if (testForCollision) {
                        colSystem.createPolygon(px + col * scale, py + row * scale, [[0, 0], [scale, scale], [0, scale]]);
                    }
                    graphics.drawPolygon([px + col * scale, py + row * scale, px + col * scale + scale, py + row * scale + scale, px + col * scale, py + row * scale + scale, px + col * scale, py + row * scale]);
                    break;
                case '#':
                    if (testForCollision) {
                        colSystem.createPolygon(px + col * scale, py + row * scale, [[0, 0], [scale, 0], [scale, scale], [0, scale]]);
                    }
                    graphics.beginFill(0x1111FF);
                    graphics.drawRect(px + col * scale, py + row * scale, scale, scale);
                    graphics.endFill();
                    break;
                case '_':
                    if (testForCollision) {
                        let platform = colSystem.createPolygon(px + col * scale, py + row * scale, [[0, scale], [scale, scale], [scale, scale - 2], [0, scale - 2]]);
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

    for (const wall of potentials) {
        if (shipPoly.collides(wall, result)) {
            collision = wall.isAPlatform ? -1 : 1;

	    if(wall.isABullet) {
		collision = 2;
		wall.isABullet.c = 0;
	    }
        }
    }

    bullets.forEach(function (b) {
       const pots = b.potentials();
	
       for (const wall of pots) {
          if (b.collides(wall, result)) {
	      b.isABullet.c = 0;
	  }
       }
    });
    
    if (debugCrash) {
        if (!canvas) {
            canvas = document.createElement('canvas');
            document.body.appendChild(canvas);

            canvas.width = window.innerWidth;
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

init();
