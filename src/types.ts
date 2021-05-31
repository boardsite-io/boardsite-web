import { ShapeConfig } from "konva/types/Shape"
import { Transformer } from "konva/types/shapes/Transformer"
import { Polygon } from "sat"

export interface Tool {
    type: number
    style: {
        color: string
        width: number
        opacity?: number
    }
}

// eslint-disable-next-line no-shadow
export enum ToolType {
    Eraser,
    Pen,
    Line,
    Triangle,
    Circle,
    Drag,
    Rectangle,
    Select,
}

export interface LiveStroke extends Tool {
    pointsSegments: number[][]
    x?: number
    y?: number

    updatePoints?: (point: Point, scale: number, sample: number) => void
    flatPoints?: () => number[]
    getShape?: (shapeProps: ShapeConfig) => JSX.Element
}

// Partial => Optional inputs from Tool
export interface Stroke extends Tool {
    id: string
    pageId: string
    scaleX?: number
    scaleY?: number
    points: number[]
    x?: number
    y?: number

    hitboxes?: Polygon[]

    serialize?: () => Stroke
    processPoints?: () => void
    update?: ({ x, y, scaleX, scaleY }: Stroke) => void
    getShape?: (shapeProps: ShapeConfig) => JSX.Element
    calculateHitbox?: () => void
}

export interface StrokeMap {
    [id: string]: Stroke
}

export type StrokeShape = Stroke & ShapeConfig

export interface PageMeta {
    background: {
        style: PageBackground
        pageNum: number
    }
}

export interface Page {
    pageId: string
    strokes: StrokeMap
    meta: PageMeta

    add: (index?: number) => void
    clear: () => void
    updateMeta: (meta: PageMeta) => void
    updateBackground: (style: PageBackground) => void
}

export interface PageCollection {
    [pid: string]: Page
}

export interface User {
    id: string
    alias: string
    color: string
}

export type Point = {
    x: number
    y: number
}

export type Hitbox = {
    v1: Point
    v2: Point
    v3: Point
    v4: Point
}

export interface StrokeHitbox {
    [id: string]: Hitbox[]
}

export type PageBackground = "blank" | "checkered" | "ruled" | "doc"

export type TrRefType = React.RefObject<Transformer>
