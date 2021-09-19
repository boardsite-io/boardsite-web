import React, { useState } from "react"
import { handleDocument } from "drawing/handlers"
import {
    StyledDivNoTouch,
    StyledFileDropZone,
    StyledIcon,
    StyledSubtitle,
    StyledTitle,
} from "./filedrop.styled"
import { InvisibleInput } from "./filedropzone.styled"

interface FileDropZoneProps {
    closeDialog: () => void
}

const FileDropZone: React.FC<FileDropZoneProps> = ({ closeDialog }) => {
    const [hovering, setHovering] = useState<boolean>(false)

    const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault() // Prevent file from being opened
        setHovering(false)

        const file = e.dataTransfer.items[0].getAsFile()
        if (file) {
            handleDocument(file).then(() => closeDialog())
        }
    }

    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault() // Prevent file from being opened
        setHovering(true)
    }

    const onDragLeave = () => {
        setHovering(false)
    }
    const onInput = (e: React.SyntheticEvent) => {
        const target = e.target as HTMLInputElement
        if (target.files && target.files[0]) {
            handleDocument(target.files[0]).then(() => closeDialog())
        }
    }

    return (
        <>
            <StyledFileDropZone
                onClick={() => document.getElementById("selectedFile")?.click()}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                $hovering={hovering}>
                <StyledDivNoTouch>
                    <StyledIcon />
                    <StyledTitle>{hovering ? "" : "Browse Files"}</StyledTitle>
                    <StyledSubtitle>
                        {hovering ? "" : "Drag and drop files here"}
                    </StyledSubtitle>
                </StyledDivNoTouch>
            </StyledFileDropZone>
            <InvisibleInput type="file" id="selectedFile" onInput={onInput} />
        </>
    )
}

export default FileDropZone
