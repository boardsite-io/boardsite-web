import { Image } from "react-konva"
import React, { memo, useEffect, useRef, useState } from "react"
import * as types from "konva/types/shapes/Image"
import store from "redux/store"
import {
    CANVAS_FULL_HEIGHT,
    CANVAS_HEIGHT,
    CANVAS_WIDTH,
    DOC_SCALE,
    pageType,
} from "../constants"
import { loadNewPDF, pageBackground } from "../drawing/page"
import { useCustomSelector } from "../redux/hooks"

interface PageBackgroundProps {
    pageId: string
}

export default memo<PageBackgroundProps>(({ pageId }) => {
    // pageId might not be valid anymore, exit then
    if (!store.getState().boardControl.pageCollection[pageId]) {
        return null
    }
    const ref = useRef<types.Image>(null)
    const [update, setUpdate] = useState(0)
    // select style, selecting background doesnt trigger, bc it compares on the same reference
    const style = useCustomSelector(
        (state) =>
            state.boardControl.pageCollection[pageId]?.meta?.background?.style
    )
    const document = useCustomSelector((state) => state.boardControl.document)
    const pageRank = useCustomSelector((state) => state.boardControl.pageRank)
    const background = useCustomSelector(
        (state) => state.boardControl.pageCollection[pageId]?.meta.background
    )

    // get correct image data for document type background
    const getImage = () => {
        if (style !== pageType.DOC) {
            return undefined
        }
        const img = document[background.documentPageNum]
        // if image data not available, load document
        if (!img) {
            loadNewPDF(background.attachId).then(() =>
                setUpdate((prev) => prev + 1)
            )
        }
        return img
    }

    // cache the shape on update
    useEffect(() => {
        ref.current?.cache({ pixelRatio: DOC_SCALE })
    }, [update])

    // clear the cache and redraw when pagebackground changes
    useEffect(() => {
        ref.current?.clearCache()
        // schedule new caching
        setUpdate((prev) => prev + 1)
    }, [style])

    return (
        <Image
            ref={ref}
            image={getImage()}
            height={CANVAS_HEIGHT}
            width={CANVAS_WIDTH}
            x={0}
            y={CANVAS_FULL_HEIGHT * pageRank.indexOf(pageId)} // relative
            stroke="#000"
            strokeWidth={0.2}
            fill="#ffffff"
            shadowColor="#000000"
            shadowBlur={10}
            shadowOffset={{ x: 0, y: 0 }}
            shadowOpacity={0.5}
            sceneFunc={
                style !== pageType.DOC ? pageBackground[style] : undefined
            }
        />
    )
})
