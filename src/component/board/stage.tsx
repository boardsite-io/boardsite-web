import React, { useEffect, memo, useRef } from "react"
import { ReactReduxContext, ReactReduxContextValue } from "react-redux"
import { createSelector } from "reselect"
import { Stage, Layer, Transformer } from "react-konva"
import { Box } from "konva/types/shapes/Transformer"
import { Vector2d } from "konva/types/types"
import { KonvaEventObject } from "konva/types/Node"
import {
    CENTER_VIEW,
    ON_WINDOW_RESIZE,
    SET_STAGE_X,
    SET_STAGE_Y,
    SCROLL_STAGE_Y,
    ZOOM_TO,
    MULTI_TOUCH_MOVE,
    MULTI_TOUCH_END,
} from "../../redux/slice/viewcontrol"

import PageContent from "./pagecontent"
import PageListener from "./pagelistener"

import LiveStroke from "./livestroke"
import {
    ZOOM_IN_WHEEL_SCALE,
    ZOOM_OUT_WHEEL_SCALE,
    CANVAS_WIDTH,
    toolType,
    TR_BORDER_STROKE,
    TR_BORDER_STROKE_WIDTH,
    TR_ANCHOR_FILL,
    TR_ANCHOR_STROKE,
    TR_ANCHOR_SIZE,
    TR_ANCHOR_CORNER_RADIUS,
} from "../../constants"
import store, { RootState } from "../../redux/store"
import { useCustomSelector } from "../../redux/hooks"
import { LayerRefType, TrRefType } from "../../types"

const BoardStage: React.FC = () => {
    const isPanMode = useCustomSelector((state) => state.drawControl.isPanMode)
    const stageWidth = useCustomSelector(
        (state) => state.viewControl.stageWidth
    )
    const stageHeight = useCustomSelector(
        (state) => state.viewControl.stageHeight
    )
    const stageX = useCustomSelector((state) => state.viewControl.stageX)
    const stageY = useCustomSelector((state) => state.viewControl.stageY)
    const stageScale = useCustomSelector(
        (state) => state.viewControl.stageScale
    )
    const keepCentered = useCustomSelector(
        (state) => state.viewControl.keepCentered
    )

    useEffect(() => {
        window.addEventListener("resize", () =>
            store.dispatch(ON_WINDOW_RESIZE())
        ) // listen for resize to update stage dimensions
        store.dispatch(CENTER_VIEW())
    }, [])

    /**
     * Wheel event handler function
     * @param {event} e
     */
    function onWheel(e: KonvaEventObject<WheelEvent>) {
        e.evt.preventDefault()
        if (isPanMode || e.evt.ctrlKey) {
            let zoomScale
            if (e.evt.deltaY < 0) {
                zoomScale = ZOOM_IN_WHEEL_SCALE
            } else {
                zoomScale = ZOOM_OUT_WHEEL_SCALE
            }
            store.dispatch(
                ZOOM_TO({
                    zoomPoint: e.target.getStage()?.getPointerPosition(),
                    zoomScale,
                })
            )
        } else {
            store.dispatch(SCROLL_STAGE_Y(e.evt.deltaY))
        }
    }

    /**
     * Handles updating the states after stage drag events
     * @param {event} e
     */
    function onDragEnd(e: KonvaEventObject<DragEvent>) {
        if (e.target.attrs.className === "stage") {
            store.dispatch(SET_STAGE_X(e.target.attrs.x))
            store.dispatch(SET_STAGE_Y(e.target.attrs.y))
        }
    }

    /**
     *
     * @param {object} pos current position of drag event on stage, e.g. {x: 12, y: 34}
     */
    function dragBound(pos: Vector2d) {
        if (keepCentered) {
            const x = (stageWidth - CANVAS_WIDTH * stageScale.x) / 2
            if (x >= 0) {
                return { x, y: pos.y }
            }
        }

        return pos
    }

    const handleTouchMove = (e: KonvaEventObject<TouchEvent>) => {
        e.evt.preventDefault()
        const touch1 = e.evt.touches[0]
        const touch2 = e.evt.touches[1]

        if (touch1 && touch2) {
            const p1 = {
                x: touch1.clientX,
                y: touch1.clientY,
            }
            const p2 = {
                x: touch2.clientX,
                y: touch2.clientY,
            }
            store.dispatch(MULTI_TOUCH_MOVE({ p1, p2 }))
        }
    }

    const handleTouchEnd = () => {
        store.dispatch(MULTI_TOUCH_END())
    }

    return (
        <div className="wrap">
            <ReactReduxContext.Consumer>
                {(value) => (
                    <Stage
                        shadowForStrokeEnabled={false}
                        perfectDrawEnabled={false}
                        preventDefault
                        draggable={isPanMode}
                        dragBoundFunc={dragBound}
                        className="stage"
                        width={stageWidth}
                        height={stageHeight}
                        scale={stageScale}
                        x={stageX}
                        y={stageY}
                        // onDragStart={onDragStart}
                        // onDragMove={onDragMove}
                        onDragEnd={onDragEnd}
                        onContextMenu={(e) => e.evt.preventDefault()}
                        onTouchMove={isPanMode ? undefined : handleTouchMove}
                        onTouchEnd={isPanMode ? undefined : handleTouchEnd}
                        onWheel={onWheel}>
                        <ReactReduxContext.Provider value={value}>
                            <StageContent value={value} />
                        </ReactReduxContext.Provider>
                    </Stage>
                )}
            </ReactReduxContext.Consumer>
        </div>
    )
}

export default BoardStage

// all pages and content are in this component
const StageContent = memo<{ value: ReactReduxContextValue }>(() => {
    const pageCreateSelector = createSelector(
        (state: RootState) => state.boardControl.pageRank,
        (state: RootState) => state.viewControl.currentPageIndex,
        (pageRank, currentPageIndex) => {
            const minPage = currentPageIndex - 1 // Get min page candidate
            const maxPage = currentPageIndex + 1 // Get max page candidate
            const startPage = Math.max(minPage, 0) // Set start page index to candidate or to 0 if negative index
            const endPage = Math.min(maxPage + 1, pageRank.length) // Set end page index; +1 because of slice indexing
            const pageSlice = pageRank.slice(startPage, endPage)
            return pageSlice
        }
    )
    const pageSlice = useCustomSelector(pageCreateSelector)
    const layerRef: LayerRefType = useRef(null)
    const trRef: TrRefType = useRef(null)

    // unselect transformer selection when change tool
    const unSelector = createSelector(
        (state: RootState) => state.drawControl.liveStroke.type,
        (type: number) => {
            if (type !== toolType.SELECT) {
                trRef.current?.nodes([])
            }
        }
    )
    useCustomSelector(unSelector)

    const boundBoxFunc = (oldBox: Box, newBox: Box) => {
        // limit resize
        if (newBox.width < 5 || newBox.height < 5) {
            return oldBox
        }
        return newBox
    }

    return (
        <>
            {pageSlice.map((pageId: string) => (
                <Layer key={pageId} ref={layerRef}>
                    <PageListener
                        pageId={pageId}
                        trRef={trRef}
                        layerRef={layerRef}
                    />
                    <PageContent pageId={pageId} />
                    <Transformer
                        shouldOverdrawWholeArea
                        borderStroke={TR_BORDER_STROKE}
                        borderStrokeWidth={TR_BORDER_STROKE_WIDTH}
                        borderEnabled
                        // borderDash={[5, 5]}
                        anchorFill={TR_ANCHOR_FILL}
                        anchorSize={TR_ANCHOR_SIZE}
                        anchorStroke={TR_ANCHOR_STROKE}
                        anchorCornerRadius={TR_ANCHOR_CORNER_RADIUS}
                        rotateEnabled={false}
                        ref={trRef}
                        boundBoxFunc={boundBoxFunc}
                    />
                </Layer>
            ))}
            <Layer draggable={false} listening={false}>
                <LiveStroke />
            </Layer>
        </>
    )
})
