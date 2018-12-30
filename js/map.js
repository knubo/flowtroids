var mapdata;

let scale = 30;

function drawMap(g, trans) {

    if(!mapdata) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open("GET", "../maps/tournament2.map", false); // false for synchronous request
        xmlHttp.send(null);
        mapdata = xmlHttp.responseText;
    }

    parseMapData(g, mapdata, trans);
}

function parseMapData(graphics, mapdata, trans) {
    let regexp = RegExp('.*mapData:.*multiline: (.*)', 'gm');
    let match = regexp.exec(mapdata);
    let delimiter = match[1];

    let content = mapdata.split(delimiter)[1];

    let rows = content.split("\n");

    rows.shift();
    rows.pop();

    let rowT = Math.floor(trans[1] / scale);
    let colT = Math.floor(trans[0] / scale);
    let px = scale - (trans[0] % scale);
    let py = scale - (trans[1] % scale);

    graphics.lineStyle(1, 0xFFFFFF, 1);

    for (let row = -1; row < rows.length; row++) {

        let lRow = row + rowT;

        if(lRow < 0) {
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
            if(lCol < 0) {
                lCol += colData.length;
            }

            let c = colData.charAt(lCol);

            if(col * scale > window.innerWidth || row * scale > window.innerHeight) {
                continue;
            }

            switch (c) {
                case 'x':
                    graphics.drawRect(px + col * scale, py + row * scale, scale, scale);
                    break;
                case 'a':
                    graphics.drawPolygon([px + col * scale, py + row * scale, px + col * scale + scale, py + row * scale, px + col * scale + scale, py + row * scale + scale, px + col * scale, py + row * scale]);
                    break;
                case 'q':
                    graphics.drawPolygon([px + col * scale + scale, py + row * scale, px + col * scale + scale, py + row * scale + scale, px + col * scale, py + row * scale + scale, px + col * scale + scale, py + row * scale]);
                    break;
                case 's':
                    graphics.drawPolygon([px + col * scale, py + row * scale, px + col * scale + scale, py + row * scale, px + col * scale, py + row * scale + scale, px + col * scale, py + row * scale]);
                    break;
                case 'w':
                    graphics.drawPolygon([px + col * scale, py + row * scale, px + col * scale + scale, py + row * scale + scale, px + col * scale, py + row * scale + scale, px + col * scale, py + row * scale]);
                    break;
                case '#':
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

}