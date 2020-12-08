import * as draw from './drawingengine.js';
import * as proc from './processing.js';

let isMouseDown = false;
let sampleCount = 0;
let lastX = -1;
let lastY = -1;
let stroke = [];
const canvasResolutionFactor = 2;
let _activeTool = "pen";

export function handleCanvasMouseDown(e, liveCanvasRef, canvasRef, scaleRef, setActiveTool) {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const liveCanvas = liveCanvasRef.current;
    const ctxLive = liveCanvas.getContext('2d');

    setActiveTool((activeTool) => {
        _activeTool = activeTool;
        return activeTool;
    });

    // Share stroke information with live canvas context
    ctxLive.lineWidth = ctx.lineWidth;
    ctxLive.strokeStyle = ctx.strokeStyle;

    if (e.type === "touchstart") {
        e = e.changedTouches[0];
    }
    else {
        if (e.button === 0) { // left-click
            // console.log("Hi");
        } else if (e.button === 2) { // right-click
            _activeTool = "eraser";
        }
    }

    isMouseDown = true;
    sampleCount = 1;
    let rect = canvas.getBoundingClientRect();
    let x = (e.clientX - rect.left) / scaleRef.current * canvasResolutionFactor;
    let y = (e.clientY - rect.top) / scaleRef.current * canvasResolutionFactor;
    stroke = [x, y];
    lastX = x;
    lastY = y;
}

export function handleCanvasMouseMove(e, liveCanvasRef, canvasRef, scaleRef) {
    if (isMouseDown) {
        let minSampleCount = 20;
        if (e.type === "touchmove") {
            e = e.touches[0];
            minSampleCount = 3; // more precision for stylus
        }
        sampleCount += 1;
        const canvas = canvasRef.current;
        let rect = canvas.getBoundingClientRect();
        let x = (e.clientX - rect.left) / scaleRef.current * canvasResolutionFactor;;
        let y = (e.clientY - rect.top) / scaleRef.current * canvasResolutionFactor;;
        let moveDist = Math.pow(x - lastX, 2) + Math.pow(y - lastY, 2); // Quadratic distance moved from last registered point

        if (moveDist > 100 || sampleCount > minSampleCount) {
            sampleCount = 1;
            stroke.push(x, y);
            const liveCanvas = liveCanvasRef.current;
            const ctxLive = liveCanvas.getContext('2d');
            
            if (_activeTool !== "eraser") {
                draw.drawLine(lastX, lastY, x, y, ctxLive);
            }
            lastX = x;
            lastY = y;
        }
    }
}

export function handleCanvasMouseUp(e, liveCanvasRef, pageId, canvasRef, wsRef, setStrokeCollection, setHitboxCollection, setUndoStack, scaleRef) {
    if (!isMouseDown) { return; } // Ignore reentering
    isMouseDown = false;
    lastX = -1;
    lastY = -1;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let rect = canvas.getBoundingClientRect();
    if (e.type !== "touchend" && e.type !== "touchcancel") {
        let x = (e.clientX - rect.left) / scaleRef.current * canvasResolutionFactor;;
        let y = (e.clientY - rect.top) / scaleRef.current * canvasResolutionFactor;;
        stroke.push(x, y);
    }
    stroke = draw.getCurvePoints(stroke, 0.5);
    stroke = stroke.map(x => Math.round(x * 1e3) / 1e3);
    // generate unique id
    let strokeid = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 4) + Date.now().toString(36).substr(4);
    let strokeObject = {
        page_id: pageId,
        id: strokeid,
        type: "stroke",
        line_width: ctx.lineWidth,
        color: ctx.strokeStyle,
        position: stroke,
    };

    if (_activeTool !== "eraser") {
        proc.processStrokes([strokeObject], "stroke", setStrokeCollection, setHitboxCollection, setUndoStack, wsRef, canvasRef);
        const liveCanvas = liveCanvasRef.current;
        const ctxLive = liveCanvas.getContext('2d');
        ctxLive.clearRect(0, 0, 1240, 1754);
    } else {
        draw.eraser(setHitboxCollection, setStrokeCollection, setUndoStack, strokeObject, wsRef, canvasRef);
    }
}

export function handleCanvasMouseLeave(e, liveCanvasRef, pageId, canvasRef, wsRef, setStrokeCollection, setHitboxCollection, setUndoStack, scaleRef) {
    handleCanvasMouseUp(e, liveCanvasRef, pageId, canvasRef, wsRef, setStrokeCollection, setHitboxCollection, setUndoStack, scaleRef);
}