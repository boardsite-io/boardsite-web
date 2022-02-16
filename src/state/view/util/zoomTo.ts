import { Point } from "drawing/stroke/index.types"
import { ViewTransform } from "state/view/state/index.types"
import { boundScale } from "./bounds"

interface ZoomToProps {
    viewTransform: ViewTransform
    zoomPoint: Point
    zoomScale: number
}

export const zoomTo = ({
    viewTransform,
    zoomPoint,
    zoomScale,
}: ZoomToProps): ViewTransform => {
    const scale1 = viewTransform.scale
    const scale2 = boundScale(zoomScale * scale1)

    return {
        xOffset:
            zoomPoint.x / scale2 -
            (zoomPoint.x / scale1 - viewTransform.xOffset),
        yOffset:
            zoomPoint.y / scale2 -
            (zoomPoint.y / scale1 - viewTransform.yOffset),
        scale: scale2,
    }
}
