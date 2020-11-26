let imageData;
let isMouseDown = false;
let sampleCount = 0;
let lastX = -1;
let lastY = -1;
let stroke = [];
let isEraser = false;

export function handleCanvasMouseDown(e, canvasRef) {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (e.type === "touchstart") {
        isEraser = false;
        e = e.changedTouches[0];
        imageData = ctx.getImageData(0, 0, canvas.width, canvas.height); // Save canvas state
    }
    else {
        if (e.button === 0) { // left-click
            isEraser = false;
            imageData = ctx.getImageData(0, 0, canvas.width, canvas.height); // Save canvas state
        } else if (e.button === 2) { // right-click
            isEraser = true;
        }
    }

    isMouseDown = true;
    sampleCount = 1;
    let rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    stroke = [x, y];
    lastX = x;
    lastY = y;
}

export function handleCanvasMouseMove(e, canvasRef) {
    if (isMouseDown) {
        let minSampleCount = 8;
        if (e.type === "touchmove") {
            e = e.touches[0];
            minSampleCount = 3; // more precision for stylus
        }
        sampleCount += 1;
        const canvas = canvasRef.current;
        let rect = canvas.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;
        let moveDist = Math.pow(x - lastX, 2) + Math.pow(y - lastY, 2); // Quadratic distance moved from last registered point

        if (moveDist > 100 || sampleCount > minSampleCount) {
            sampleCount = 1;
            stroke.push(x, y);
            const ctx = canvas.getContext('2d');
            if (!isEraser) {
                drawLine(lastX, lastY, x, y, ctx);
            }
            lastX = x;
            lastY = y;
        }
    }
}

export function handleCanvasMouseUp(e, canvasRef, wsRef, setStrokeCollection, setHitboxCollection, setNeedsRedraw) {
    if (!isMouseDown) { return; } // Ignore reentering
    isMouseDown = false;
    lastX = -1;
    lastY = -1;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let rect = canvas.getBoundingClientRect();
    if (e.type !== "touchend" && e.type !== "touchcancel") {
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;
        stroke.push(x, y);
    }
    stroke = getCurvePoints(stroke, 0.5);
    stroke = stroke.map(x => Math.round(x * 1e3) / 1e3);
    // generate unique id
    let strokeid = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 4) + Date.now().toString(36).substr(4);
    let strokeObject = {
        id: strokeid,
        type: "stroke",
        line_width: ctx.lineWidth,
        color: ctx.strokeStyle,
        position: stroke,
    };

    if (!isEraser) {
        // Delete livestroke lines and restroke interpolated and potentially buffered strokes
        ctx.putImageData(imageData, 0, 0);
        drawCurve(ctx, stroke);
        updateStrokeCollection(setStrokeCollection, strokeObject, wsRef);
        addHitbox(setHitboxCollection, strokeObject);
    } else {
        eraser(setHitboxCollection, setStrokeCollection, strokeObject, setNeedsRedraw, wsRef);
    }
}

export function handleCanvasMouseLeave(e, canvasRef, wsRef, setStrokeCollection, setHitboxCollection, setNeedsRedraw) {
    handleCanvasMouseUp(e, canvasRef, wsRef, setStrokeCollection, setHitboxCollection, setNeedsRedraw);
}

export function updateStrokeCollection(setStrokeCollection, strokeObject, wsRef) {
    // Add stroke to strokeCollection
    setStrokeCollection((prev) => {
        let res = { ...prev };
        res[strokeObject.id] = strokeObject;
        // console.log(res[strokeObject.id].position);
        return res;
    });

    // let colorInt = parseInt(ctx.strokeStyle.substring(1), 16);
    if (wsRef.current !== null) {
        wsRef.current.send(JSON.stringify([strokeObject]));
    }
    else {
        console.log("socket not open");
    }
}

/**
 * 
 * @param {function} setHitboxCollection state setting function
 * @param {object} strokeObject stroke object to set hitbox from
 * @param {[number: width, number: height]} boardResolution canvas resolution in pixels
 * @param {number} hitboxAccuracy accuracy in pixels
 */
export function addHitbox(setHitboxCollection, strokeObject) {
    let positions = strokeObject.position.slice(0); // create copy of positions array
    let id = strokeObject.id; // extract id

    setHitboxCollection((prev) => {
        let _prev = { ...prev }
        let pointSkipFactor = 8; // only check every p-th (x,y) position to reduce computational load
        let quadMinPixDist = 64; // quadratic minimum distance between points to be valid for hitbox calculation
        let padding = 1;
        let hitbox = getHitbox(positions, pointSkipFactor, quadMinPixDist, padding);

        // insert new hitboxes
        for (let i = 0; i < hitbox.length; i++) {
            let xy = hitbox[i];
            if (_prev.hasOwnProperty(xy)) { // other ID(s) in this hitbox position
                _prev[xy][id] = true;
            } else { // no other ID in this hitbox position
                _prev[xy] = {};
                _prev[xy][id] = true;
            }
        }
        
        return _prev;
    });
}

export function eraser(setHitboxCollection, setStrokeCollection, strokeObject, setNeedsRedraw, wsRef) {
    let positions = strokeObject.position.slice(0);
    let idsToDelete = {};

    setHitboxCollection((prev) => {
        let pointSkipFactor = 16; // only check every p-th (x,y) position to reduce computational load
        let quadMinPixDist = 25; // quadratic minimum distance between points to be valid for hitbox calculation
        let padding = 0;
        let hitbox = getHitbox(positions, pointSkipFactor, quadMinPixDist, padding);
        let _prev = { ...prev };
        for (let i = 0; i < hitbox.length; i++) {
            let xy = hitbox[i];
            if (_prev.hasOwnProperty(xy)) { // there are IDs in this hitbox position
                Object.keys(_prev[xy]).forEach((id) => {
                    idsToDelete[id] = true;
                })
            }
        }
        
        // remove deleted id hitboxes from collection
        Object.keys(_prev).forEach((posKey) => {
            Object.keys(idsToDelete).forEach((keyToDel) => {
                delete _prev[posKey][keyToDel];
            });
        });
        
        // Send ids to delete
        let deleteObjects = Object.keys(idsToDelete).map((id) => {
            return { id: id, type: "delete" };
        })

        if (deleteObjects.length > 0 && wsRef.current !== null) {
            wsRef.current.send(JSON.stringify(deleteObjects));
        }

        return _prev;
    });

    // erase id's strokes from collection
    setStrokeCollection((prev) => {
        let _prev = { ...prev }
        Object.keys(idsToDelete).forEach((keyToDel) => {
            delete _prev[keyToDel];
        });
        
        return _prev;
    });

    setNeedsRedraw(x => x + 1); // trigger redraw
}

export function getHitbox(positions, pointSkipFactor, quadMinPixDist, padding) {
    // calculate hitboxes of all segments
    let xy1 = [Math.round(positions[0]), Math.round(positions[1])];
    let xy2;
    let hitbox = [];
    for (let i = 2 * pointSkipFactor; i < positions.length; i += 2 * pointSkipFactor) {
        xy2 = [Math.round(positions[i]), Math.round(positions[i + 1])];
        if ((Math.pow(xy2[0] - xy1[0], 2) + Math.pow(xy2[1] - xy1[1], 2)) < quadMinPixDist) { // move to next iter if points too close
            continue;
        }
        let hitboxPixels = calcPixelRow(xy1[0], xy1[1], xy2[0], xy2[1]);
        hitbox = hitbox.concat(hitboxPixels);
        xy1 = xy2;
    }
    // include last point of stroke that might have been left out in for loop
    xy2 = [Math.round(positions[positions.length - 2]), Math.round(positions[positions.length - 1])];
    if ((Math.pow(xy2[0] - xy1[0], 2) + Math.pow(xy2[1] - xy1[1], 2)) < quadMinPixDist) { // check if necessary
        let hitboxPixels = calcPixelRow(xy1[0], xy1[1], xy2[0], xy2[1]);
        hitbox = hitbox.concat(hitboxPixels);
    }

    if (padding) {
        // add one pixel on all sides of the hitbox to ensure proper functionality
        let tmp = {};
        for (let i = 0; i < hitbox.length; i++) {
            tmp[hitbox[i]] = 1;
        }
        for (let i = 0; i < hitbox.length; i++) {
            let x = hitbox[i][0];
            let y = hitbox[i][1];
            for (let j = -1; j <= 1; j++) {
                for (let k = -1; k <= 1; k++) {
                    if (j || k) {
                        let pos = [x + j, y + k];
                        if (!(pos in tmp)) {
                            tmp[pos] = 1;
                        }
                    }
                }
            }
        }
        hitbox = Object.keys(tmp).map(x => JSON.parse("[" + x + "]"));
    }

    return hitbox;
}

/**
 * Calculates the pixel positions that are touched by a line, 
 * defined by the connection between (x1,y1) and (x2,y2).
 * @param {*} x1 
 * @param {*} y1 
 * @param {*} x2 
 * @param {*} y2 
 */
export function calcPixelRow(x1, y1, x2, y2) {
    // PixelReihen Algo: https://de.wikipedia.org/wiki/Rasterung_von_Linien

    if (x2 - x1 < 0) { // order so that x2 >= x1
        let cp = [x1, y1, x2, y2];
        x1 = cp[2];
        y1 = cp[3];
        x2 = cp[0];
        y2 = cp[1];
    }
    let xd = x2 - x1;
    let yd = y2 - y1;

    let hitbox = [];

    if (xd === 0) { // vertical line
        if (yd >= 0) {
            for (let i = 0; i <= yd; i++) {
                hitbox.push([x1, y1 + i]);
            }
        } else {
            for (let i = 0; i <= -yd; i++) {
                hitbox.push([x1, y2 + i]);
            }
        }
        return hitbox;
    } else if (yd === 0) { // horizontal line
        for (let i = 0; i <= xd; i++) {
            hitbox.push([x1 + i, y1]);
        }
        return hitbox;
    } else { // normal line
        let m_inv = xd / yd;
        let type = 0;
        if (1 > m_inv && m_inv > 0) {
            type = 1;
            let cp = [x1, y1, x2, y2, xd, yd];
            m_inv = 1 / m_inv;
            y1 = cp[0];
            x1 = cp[1];
            y2 = cp[2];
            x2 = cp[3];
            yd = cp[4];
            xd = cp[5];
        } else if (-1 <= m_inv && m_inv < 0) {
            type = 2;
            let cp = [x1, y1, x2, y2, xd, yd];
            m_inv = -1 / m_inv;
            x1 = cp[3]; // y2
            y1 = cp[0]; // x1
            x2 = cp[1]; // y1
            y2 = cp[2]; // x2
            yd = cp[4]; // xd
            xd = -cp[5]; // -yd
        } else if (m_inv < -1) {
            type = 3;
            let cp = [y1, y2, yd];
            y1 = cp[1];
            y2 = cp[0];
            yd = -yd;
            m_inv = -m_inv;
        }

        let rowStart = x1;
        for (let i = 0; i < yd; i++) {
            let rowEnd = Math.ceil(x1 + (0.5 + i) * m_inv - 1);
            for (let j = rowStart; j <= rowEnd; j++) {
                hitbox.push([j, y1 + i]);
            }
            rowStart = rowEnd + 1;
        }
        for (let j = rowStart; j <= x2; j++) {
            hitbox.push([j, y2]);
        }

        // CORRECT THE OUTPUT
        if (type === 1) {
            let hbox = [];
            for (let i = 0; i < hitbox.length; i++) {
                hbox.push([hitbox[i][0], hitbox[i][1]]);
            }
            return hbox;
        } else if (type === 2) {
            let pxRow = [];
            let len = hitbox.length;
            for (let i = 0; i < len; i++) {
                pxRow.push([hitbox[i][1], hitbox[len - i - 1][0]]);
            }
            return pxRow
        } else if (type === 3) {
            let pxRow = [];
            let len = hitbox.length;
            for (let i = 0; i < len; i++) {
                pxRow.push([hitbox[i][0], hitbox[len - i - 1][1]])
            }
            return pxRow;
        } else {
            return hitbox;
        }
    }
}

// draw line
export function drawLine(x1, y1, x2, y2, ctx) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

// draw rectangle with background
// function drawFillRect(x, y, w, h, color) {
//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext('2d');
//     ctx.beginPath();
//     ctx.fillStyle = color;
//     ctx.fillRect(x, y, w, h);
// }

export function getCurvePoints(pts, tension, isClosed, numOfSegments) {
    // use input value if provided, or use a default value	 
    tension = (typeof tension != 'undefined') ? tension : 0.5;
    isClosed = isClosed ? isClosed : false;
    numOfSegments = numOfSegments ? numOfSegments : 16;

    var _pts = [], res = [],	// clone array
        x, y,			// our x,y coords
        t1x, t2x, t1y, t2y,	// tension vectors
        c1, c2, c3, c4,		// cardinal points
        st, t, i;		// steps based on num. of segments

    // clone array so we don't change the original
    //
    _pts = pts.slice(0);

    // The algorithm require a previous and next point to the actual point array.
    // Check if we will draw closed or open curve.
    // If closed, copy end points to beginning and first points to end
    // If open, duplicate first points to befinning, end points to end
    if (isClosed) {
        _pts.unshift(pts[pts.length - 1]);
        _pts.unshift(pts[pts.length - 2]);
        _pts.unshift(pts[pts.length - 1]);
        _pts.unshift(pts[pts.length - 2]);
        _pts.push(pts[0]);
        _pts.push(pts[1]);
    }
    else {
        _pts.unshift(pts[1]);	//copy 1. point and insert at beginning
        _pts.unshift(pts[0]);
        _pts.push(pts[pts.length - 2]);	//copy last point and append
        _pts.push(pts[pts.length - 1]);
    }

    // ok, lets start..

    // 1. loop goes through point array
    // 2. loop goes through each segment between the 2 pts + 1e point before and after
    for (i = 2; i < (_pts.length - 4); i += 2) {
        for (t = 0; t <= numOfSegments; t++) {

            // calc tension vectors
            t1x = (_pts[i + 2] - _pts[i - 2]) * tension;
            t2x = (_pts[i + 4] - _pts[i]) * tension;

            t1y = (_pts[i + 3] - _pts[i - 1]) * tension;
            t2y = (_pts[i + 5] - _pts[i + 1]) * tension;

            // calc step
            st = t / numOfSegments;

            // calc cardinals
            c1 = 2 * Math.pow(st, 3) - 3 * Math.pow(st, 2) + 1;
            c2 = -(2 * Math.pow(st, 3)) + 3 * Math.pow(st, 2);
            c3 = Math.pow(st, 3) - 2 * Math.pow(st, 2) + st;
            c4 = Math.pow(st, 3) - Math.pow(st, 2);

            // calc x and y cords with common control vectors
            x = c1 * _pts[i] + c2 * _pts[i + 2] + c3 * t1x + c4 * t2x;
            y = c1 * _pts[i + 1] + c2 * _pts[i + 3] + c3 * t1y + c4 * t2y;

            //store points in array
            res.push(x);
            res.push(y);

        }
    }
    return res;
}

// DRAWING FUNCTIONS FROM STACKOVERFLOW
export function drawCurve(ctx, ptsa) {
    ctx.beginPath();
    drawLines(ctx, ptsa);
    ctx.stroke();
}

export function drawLines(ctx, pts) {
    ctx.moveTo(pts[0], pts[1]);
    for (var i = 2; i < pts.length - 1; i += 2){
        ctx.lineTo(pts[i], pts[i + 1]);
    } 
}
