import React, { useState } from "react"
import { BsPencil } from "react-icons/bs"
import { FiMinus, FiCircle, FiSquare } from "react-icons/fi"
import { useCustomSelector } from "../../../redux/hooks"
import { SET_TYPE } from "../../../redux/slice/drawcontrol"
import store from "../../../redux/store"
import { ToolType } from "../../../types"
import StylePicker from "./stylepicker"

export const PenTool: React.FC = () => {
    const [open, setOpen] = useState(false)
    const typeSelector = useCustomSelector(
        (state) => state.drawControl.liveStroke.type
    )
    const colorSelector = useCustomSelector(
        (state) => state.drawControl.liveStroke.style.color
    )

    let icon
    switch (typeSelector) {
        case ToolType.Pen:
            icon = <BsPencil id="icon" />
            break
        case ToolType.Line:
            icon = <FiMinus id="icon" />
            break
        case ToolType.Rectangle:
            icon = <FiSquare id="icon" />
            break
        case ToolType.Circle:
            icon = <FiCircle id="icon" />
            break
        default:
            icon = <BsPencil id="icon" />
            break
    }

    const isDrawingTool = () =>
        typeSelector === ToolType.Pen ||
        typeSelector === ToolType.Line ||
        typeSelector === ToolType.Rectangle ||
        typeSelector === ToolType.Circle

    return (
        <div className="session-dialog-div">
            <button
                type="button"
                style={isDrawingTool() ? { color: colorSelector } : {}}
                id="icon-button"
                onClick={
                    isDrawingTool()
                        ? () => setOpen(true)
                        : () => store.dispatch(SET_TYPE(ToolType.Pen))
                }>
                {icon}
            </button>
            {
                // Palette Popup
                open ? (
                    <div className="popup">
                        <div
                            role="button"
                            tabIndex={0}
                            className="cover"
                            onClick={() => setOpen(false)}
                        />
                        <StylePicker />
                    </div>
                ) : null
            }
        </div>
    )
}
