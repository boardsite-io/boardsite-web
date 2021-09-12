import React, { memo, useState } from "react"
import { Circle, Ellipse, Line, Rect } from "react-konva"
import { LineJoin, LineCap } from "konva/types/Shape"
import { LineConfig } from "konva/types/shapes/Line"
import { useCustomSelector } from "../../redux/hooks"
import store from "../../redux/store"
import {
    MOVE_OPACITY,
    SEL_FILL,
    SEL_FILL_ENABLED,
    SEL_STROKE,
    SEL_STROKE_ENABLED,
} from "../../constants"
import { Point, Stroke, ToolType } from "../stroke/types"

export const LiveStrokeShape = memo(() => {
    const { liveStroke } = store.getState().drawControl
    // trigger rerender when livestroke is updated
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const u = useCustomSelector((state) => state.drawControl.liveStrokeUpdate)
    return (
        <>
            {liveStroke.pointsSegments?.map((subPts: number[], i: number) => {
                const strokeSegment = { ...liveStroke, points: subPts.slice() }
                return (
                    // we can use the array index as key here
                    // since the array's order is not changed
                    // eslint-disable-next-line react/no-array-index-key
                    <StrokeShape key={i} stroke={strokeSegment} />
                )
            })}
        </>
    )
})

interface StrokeShapeProps {
    stroke: Stroke
}

/**
 * Super component implementing all stroke types and their visualization in the canvas
 * In order for memo to work correctly, we have to pass the stroke props by value
 * referencing an object will result in unwanted rerenders, since we just compare
 * the object references.
 */
export const StrokeShape = memo<StrokeShapeProps>(({ stroke }) => {
    const [isDragging, setDragging] = useState(false)
    // Tmp Fix: selector for x,y,scale in order to trigger
    // a rerender when stroke is updated/moved
    const strokeSel = useCustomSelector((state) => {
        const { isDraggable } = state.drawControl
        const s =
            state.boardControl.pageCollection[stroke.pageId]?.strokes[stroke.id]
        return {
            isDraggable,
            x: s?.x,
            y: s?.y,
            scaleX: s?.scaleX,
            scaleY: s?.scaleY,
        }
    })

    const shapeProps = {
        name: stroke.pageId, // required to find via selector
        id: stroke.id,
        x: stroke.x,
        y: stroke.y,
        scaleX: stroke.scaleX,
        scaleY: stroke.scaleY,
        lineCap: "round" as LineCap,
        lineJoin: "round" as LineJoin,
        stroke: stroke.style.color,
        fill: undefined,
        strokeWidth: stroke.style.width,
        opacity: isDragging ? MOVE_OPACITY : stroke.style.opacity,
        draggable: strokeSel.isDraggable ?? false,
        onDragStart: () => setDragging(true),
        onDragEnd: () => setDragging(false),
        listening: true,
        shadowForStrokeEnabled: false, // for performance, see Konva docs
        points: stroke.points, // external supplied points may overwrite stroke.points for e.g. livestroke
    }

    return createShape(stroke, shapeProps)
})

// Use LineConfig since it requires points prop
const createShape = (stroke: Stroke, shapeProps: LineConfig): JSX.Element => {
    switch (stroke.type) {
        case ToolType.Pen: {
            return <Line tension={0.35} {...shapeProps} />
        }
        case ToolType.Line:
            return <Line tension={0.35} {...shapeProps} />
        case ToolType.Circle:
            return (
                <Ellipse
                    {...shapeProps}
                    radiusX={Math.abs(
                        (shapeProps.points[2] - shapeProps.points[0]) / 2
                    )}
                    radiusY={Math.abs(
                        (shapeProps.points[3] - shapeProps.points[1]) / 2
                    )}
                    fillEnabled={false} // Remove inner hitbox from empty circles
                />
            )
        case ToolType.Rectangle:
            return (
                <Rect
                    {...shapeProps}
                    width={shapeProps.points[2] - shapeProps.points[0]}
                    height={shapeProps.points[3] - shapeProps.points[1]}
                    fillEnabled
                />
            )
        case ToolType.Select:
            return (
                <Rect
                    {...shapeProps}
                    width={shapeProps.points[2] - shapeProps.points[0]}
                    height={shapeProps.points[3] - shapeProps.points[1]}
                    stroke={SEL_STROKE}
                    strokeEnabled={SEL_STROKE_ENABLED}
                    fill={SEL_FILL}
                    fillEnabled={SEL_FILL_ENABLED}
                />
            )
        default:
            return <></>
    }
}

/**
 * Function to draw circles at stroke points.
 */
export function debugStrokePoints(
    points: number[],
    width: number
): JSX.Element {
    const pts: Point[] = []
    for (let i = 0; i < points.length; i += 2) {
        pts.push({ x: points[i], y: points[i + 1] })
    }
    return (
        <>
            {pts.map((pt, i) => (
                <Circle
                    // eslint-disable-next-line react/no-array-index-key
                    key={i}
                    x={pt.x}
                    y={pt.y}
                    radius={width / 2}
                    fill="#00ff00"
                    strokeWidth={0}
                />
            ))}
        </>
    )
}
