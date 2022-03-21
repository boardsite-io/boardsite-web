import { Point } from "drawing/stroke/index.types"
import { ViewTransform } from "state/view/state/index.types"
import { menu } from "state/menu"
import { DialogState, MainMenuState } from "state/menu/state/index.types"
import { board } from "state/board"

export const getCenterOfScreen = () => ({
    x: getCenterX(),
    y: getCenterY(),
})

export const getCenterX = (): number => window.innerWidth / 2

export const getCenterY = (): number => window.innerHeight / 2

export const getViewCenterX = (viewTransform: ViewTransform): number =>
    applyTransform1D(getCenterX(), viewTransform.scale, viewTransform.xOffset)

export const getViewCenterY = (viewTransform: ViewTransform): number =>
    applyTransform1D(getCenterY(), viewTransform.scale, viewTransform.yOffset)

export const applyTransform1D = (x: number, scale: number, offset: number) =>
    x - scale * offset

export const applyTransformToPoint = (
    point: Point,
    transform: ViewTransform
): Point => ({
    x: applyTransform1D(point.x, transform.scale, transform.xOffset),
    y: applyTransform1D(point.y, transform.scale, transform.yOffset),
})

export const isFullScreen = (viewTransform: ViewTransform) => {
    const effectivePageWidth = board.getPageSize().width * viewTransform.scale
    return effectivePageWidth > window.innerWidth
}

export const isMenuOpen = () =>
    menu.getState().mainMenuState !== MainMenuState.Closed ||
    menu.getState().shortcutsOpen ||
    menu.getState().dialogState !== DialogState.Closed
