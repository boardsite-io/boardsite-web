import React, { memo, useEffect, useRef } from "react"
import { Group } from "react-konva"
import store from "redux/store"
import { Group as GroupType } from "konva/lib/Group"
import { useCustomSelector } from "redux/hooks"
import { StrokeShape } from "../stroke/shape"
import { PageProps } from "./index.types"

const Strokes: React.FC<PageProps> = memo(({ pageId, pageSize }) => {
    const ref = useRef<GroupType>(null)

    // pageId might not be valid anymore, exit then
    if (!store.getState().board.pageCollection[pageId]) {
        return null
    }
    // select key of stroke map as trigger
    // stroke map comparison will only compare references
    const trigger = useCustomSelector((state) => state.board.renderTrigger)

    useEffect(() => {
        ref.current?.parent?.clearCache()
        // delay caching a bit to redraw updated strokes
        setTimeout(() => ref.current?.parent?.cache(), 100)
    }, [trigger])

    return (
        <Group
            ref={ref}
            {...pageSize}
            globalCompositeOperation="source-atop"
            listening={false}>
            {Object.keys(
                store.getState().board.pageCollection[pageId]?.strokes
            ).map((id) => (
                <StrokeShape
                    key={id}
                    stroke={
                        store.getState().board.pageCollection[pageId]?.strokes[
                            id
                        ]
                    }
                />
            ))}
        </Group>
    )
})

export default Strokes
