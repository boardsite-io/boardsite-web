import React, { useState } from "react"
import {
    BsFileMinus,
    BsFileRuled,
    BsTrash,
    BsFileArrowDown,
    BsFileArrowUp,
    BsFileDiff,
} from "react-icons/bs"
import {
    handleAddPageOver,
    handleAddPageUnder,
    handleClearPage,
    handleDeleteAllPages,
    handleDeletePage,
} from "../../../../drawing/handlers"
import PageSettings from "../pagesettings/pagesettings"
import IconButton from "../iconbutton/iconbutton"
import Popup from "../popup/popup"
import {
    PageOptionsWrapper,
    PageOptionsWrapperInner,
} from "./pageoptions.styled"

const PageOptions: React.FC = () => {
    const [open, setOpen] = useState(false)

    return (
        <PageOptionsWrapper>
            <IconButton onClick={() => setOpen(true)}>
                <BsFileDiff id="icon" />
            </IconButton>
            <Popup open={open} onClose={() => setOpen(false)}>
                <PageOptionsWrapperInner>
                    <IconButton onClick={handleAddPageOver}>
                        <BsFileArrowUp id="icon" />
                    </IconButton>
                    <IconButton onClick={handleAddPageUnder}>
                        <BsFileArrowDown id="icon" />
                    </IconButton>
                    <IconButton onClick={() => handleDeletePage()}>
                        <BsFileMinus id="icon" />
                    </IconButton>
                    <IconButton onClick={() => handleClearPage()}>
                        <BsFileRuled id="icon" />
                    </IconButton>
                    <IconButton onClick={handleDeleteAllPages}>
                        <BsTrash id="icon" />
                    </IconButton>
                    <PageSettings setOpenOther={setOpen} />
                </PageOptionsWrapperInner>
            </Popup>
        </PageOptionsWrapper>
    )
}

export default PageOptions
