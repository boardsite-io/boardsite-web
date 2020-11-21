import React, { useRef, useEffect } from 'react';

function Whiteboard(props) {
    const wsRef = useRef();
    const canvasRef = useRef();

    let isMouseDown = false;
    let sampleCount = 0;
    let lastX = -1;
    let lastY = -1;
    let stroke = [];

    useEffect(() => {
        const canvas = canvasRef.current;
        canvas.width = 620; //canvas.clientWidth;
        canvas.height = 877; //canvas.clientHeight;
        canvas.addEventListener("contextmenu", e => e.preventDefault()); // Disable Context Menu
        canvas.addEventListener("mousedown", (e) => handleCanvasMouseDown(e));
        canvas.addEventListener("mouseup", (e) => handleCanvasMouseUp(e));
        canvas.addEventListener("mousemove", (e) => handleCanvasMouseMove(e));
        canvas.addEventListener("mouseleave", (e) => handleCanvasMouseLeave(e));

        return () => {
            canvas.removeEventListener("contextmenu", e => e.preventDefault());
            canvas.removeEventListener("mousedown", (e) => handleCanvasMouseDown(e));
            canvas.removeEventListener("mouseup", (e) => handleCanvasMouseUp(e));
            canvas.removeEventListener("mousemove", (e) => handleCanvasMouseMove(e));
            canvas.removeEventListener("mouseleave", (e) => handleCanvasMouseLeave(e));
        };
    },[])

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.lineWidth = props.lineWidth;
        ctx.strokeStyle = props.strokeStyle;
    }, [props.lineWidth, props.strokeStyle])

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, window.innerHeight, window.innerWidth);
        props.strokeCollection.forEach((stroke) => {
            ctx.strokeStyle = stroke[0];
            ctx.lineWidth = stroke[1];
            return drawCurve(ctx, stroke.slice(2));
        })
    }, [props.strokeCollection])

    function handleCanvasMouseDown(e) {
        const canvas = canvasRef.current;
        isMouseDown = true;
        sampleCount = 1;
        let rect = canvas.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;
        
        stroke = [x, y];

        lastX = x;
        lastY = y;

        // if (e.button === 2) {
        //     drawFillRect(x, y, 50, 50, "#f0f");
        // }
        // else {
        //     drawFillRect(x, y, 50, 50, "#0f0");
        // }
    }

    function handleCanvasMouseMove(e) {
        if (isMouseDown) {
            sampleCount += 1;
            const canvas = canvasRef.current;
            let rect = canvas.getBoundingClientRect();
            let x = e.clientX - rect.left;
            let y = e.clientY - rect.top;
            let moveDist = Math.pow(x - lastX, 2) + Math.pow(y - lastY, 2); // Quadratic distance moved from last registered point

            if (moveDist > 50 && sampleCount > 5) {
                sampleCount = 1;
                stroke.push(x, y);
                drawLine(lastX, lastY, x, y, props.lineWidth, props.strokeStyle);
                lastX = x;
                lastY = y;
            }
        }
    }

    function handleCanvasMouseUp(e) {
        if (!isMouseDown) { return; } // Ignore reentering
        isMouseDown = false;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let rect = canvas.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;
        stroke.push(x, y);
        stroke = getCurvePoints(stroke, 0.5);
        stroke.unshift(ctx.lineWidth);
        stroke.unshift(ctx.strokeStyle);

        lastX = -1;
        lastY = -1;

        // Add stroke to strokeCollection
        props.setStrokeCollection(strokeCollection => { return [...strokeCollection, stroke]; });
        let strokeid = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 4) + Date.now().toString(36);
        // let colorInt = parseInt(ctx.strokeStyle.substring(1), 16);
        if (props.wsRef.current !== null) {
            props.wsRef.current.send(JSON.stringify([{ id: strokeid, type: "stroke", line_width: ctx.lineWidth, color: ctx.strokeStyle, position: stroke.slice(2) }]));
        }
        else {
            console.log("socket not open");
        }
    }

    function handleCanvasMouseLeave(e) {
        handleCanvasMouseUp(e);
    }

    // draw line
    function drawLine(x1, y1, x2, y2, w, color) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

    // draw rectangle with background
    function drawFillRect(x, y, w, h, color) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
    }

    // DRAWING FUNCTIONS FROM STACKOVERFLOW
    function drawCurve(ctx, ptsa, showPoints) {
        ctx.beginPath();
        drawLines(ctx, ptsa);
        if (showPoints) {
            ctx.beginPath();
            for (var i = 0; i < ptsa.length - 1; i += 2)
                ctx.rect(ptsa[i] - 2, ptsa[i + 1] - 2, 4, 4);
        }

        ctx.stroke();
    }

    function getCurvePoints(pts, tension, isClosed, numOfSegments) {
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

    function drawLines(ctx, pts) {
        ctx.moveTo(pts[0], pts[1]);
        for (var i = 2; i < pts.length - 1; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    }

    return (
        <div websocket={wsRef.current} className="canvasdiv">
            <canvas ref={canvasRef} />
        </div>
    );
}

export default Whiteboard;

