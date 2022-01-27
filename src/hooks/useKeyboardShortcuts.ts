import { JUMP_TO_NEXT_PAGE, JUMP_TO_PREV_PAGE } from "redux/board/board"
import store from "redux/store"
import { handleSetTool, handleRedo, handleUndo } from "drawing/handlers"
import { ToolType } from "drawing/stroke/index.types"
import { useEffect } from "react"
import { MainMenuState } from "redux/menu/menu"

export const useKeyboardShortcuts = (): void => {
    useEffect(() => {
        document.addEventListener("keydown", keyListener)
        return () => {
            document.removeEventListener("keydown", keyListener)
        }
    }, [])
}

// Check if any menu is open
const isInMenu = (): boolean => {
    const { aboutOpen, mainMenuState, shortcutsOpen } = store.getState().menu

    return aboutOpen || mainMenuState !== MainMenuState.Closed || shortcutsOpen
}

const keyListener = (e: KeyboardEvent): void => {
    // Avoid triggering shortcuts while in menus
    if (isInMenu()) {
        return
    }

    switch (e.key) {
        case "ArrowUp":
            store.dispatch(JUMP_TO_PREV_PAGE())
            break
        case "ArrowLeft":
            store.dispatch(JUMP_TO_PREV_PAGE())
            break
        case "ArrowDown":
            store.dispatch(JUMP_TO_NEXT_PAGE())
            break
        case "ArrowRight":
            store.dispatch(JUMP_TO_NEXT_PAGE())
            break
        case "1":
        case "a":
            handleSetTool({
                type:
                    store.getState().drawing.tool.latestDrawType ??
                    ToolType.Pen,
            })
            break
        case "2":
        case "e":
            handleSetTool({ type: ToolType.Eraser })
            break
        case "3":
        case "s":
            handleSetTool({ type: ToolType.Select })
            break
        case "4":
        case " ":
            handleSetTool({ type: ToolType.Pan })
            break
        case "5":
        case "p":
            handleSetTool({ type: ToolType.Pen })
            break
        case "6":
        case "l":
            handleSetTool({ type: ToolType.Line })
            break
        case "7":
        case "r":
            handleSetTool({ type: ToolType.Rectangle })
            break
        case "8":
        case "c":
            handleSetTool({ type: ToolType.Circle })
            break
        case "z": // Undo (Ctrl + Z)
            if (e.ctrlKey && !e.repeat) {
                handleUndo()
            }
            break
        case "y": // Redo (Ctrl + Y)
            if (e.ctrlKey && !e.repeat) {
                handleRedo()
            }
            break
        default:
            break
    }
}
