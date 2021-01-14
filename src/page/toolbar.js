import React, { useState } from 'react';
import { IconButton, Input, Slider } from '@material-ui/core';

import PaletteIcon from '@material-ui/icons/Palette';
import CreateIcon from '@material-ui/icons/Create';

import UndoIcon from '@material-ui/icons/Undo';
import RedoIcon from '@material-ui/icons/Redo';

import { SketchPicker } from 'react-color'

import RemoveIcon from '@material-ui/icons/Remove';
import ChangeHistoryIcon from '@material-ui/icons/ChangeHistory';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';

import BrushIcon from '@material-ui/icons/Brush';
import HighlightOffIcon from '@material-ui/icons/HighlightOff';

import Tooltip from '@material-ui/core/Tooltip';

function Toolbar(props) {
    const [displayColorPicker, setDisplayColorPicker] = useState(false);
    const [displayWidthPicker, setDisplayWidthPicker] = useState(false);
    const [displayExtraTools, setDisplayExtraTools] = useState(false);
    const [color, setColor] = useState({ r: '0', g: '0', b: '0', a: '1', });
    const minWidth = 1;
    const maxWidth = 40;

    function handlePaletteClick() {
        setDisplayColorPicker(!displayColorPicker);
    };

    function handleWidthClick() {
        setDisplayWidthPicker(!displayWidthPicker);
    };

    function handlePaletteClose() {
        setDisplayColorPicker(false);
    };

    function handleWidthClose() {
        setDisplayWidthPicker(false);
    };

    function handlePaletteChange(color) {
        setColor(color.rgb);
        props.setStrokeStyle(color.hex)
    };

    const handleSliderChange = (event, newValue) => {
        props.setLineWidth(newValue);
    };

    const handleInputChange = (event) => {
        props.setLineWidth(event.target.value === '' ? '' : Number(event.target.value));
    };

    // Slider Functions
    const handleBlur = () => {
        if (props.lineWidth < minWidth) {
            props.setLineWidth(minWidth);
        } else if (props.lineWidth > maxWidth) {
            props.setLineWidth(maxWidth);
        }
    };

    return (
        <div className="toolbar">
            <IconButton id="iconButton" style={{ backgroundColor: "grey" }} onClick={props.debug}>
                D
            </IconButton>
            <Tooltip id="tooltip" title="undo" TransitionProps={{ timeout: 0 }} placement="bottom">
                <IconButton id="iconButton" variant="contained" onClick={props.handleUndo}>
                    <UndoIcon id="iconButtonInner" />
                </IconButton>
            </Tooltip>
            <Tooltip id="tooltip" title="redo" TransitionProps={{ timeout: 0 }} placement="bottom">
                <IconButton id="iconButton" variant="contained" onClick={props.handleRedo}>
                    <RedoIcon id="iconButtonInner" />
                </IconButton>
            </Tooltip>
            <div className="toolring">
                <Tooltip id="tooltip" title="pen" TransitionProps={{ timeout: 0 }} placement="bottom">
                    {
                        props.activeTool === "pen" ?
                            <IconButton id="iconButtonActive" variant="contained" onClick={() => setDisplayExtraTools((prev) => !prev)}>
                                <BrushIcon id="iconButtonActiveInner" />
                            </IconButton>
                            :
                            <IconButton id="iconButton" variant="contained" onClick={() => {
                                props.setActiveTool("pen");
                                setDisplayExtraTools(false);
                            }}>
                                <BrushIcon id="iconButtonInner" />
                            </IconButton>
                    }
                </Tooltip>
                <Tooltip id="tooltip" title="eraser" TransitionProps={{ timeout: 0 }} placement="bottom">
                    {
                        props.activeTool === "eraser" ?
                            <IconButton id="iconButtonActive" variant="contained" onClick={() => props.setActiveTool("eraser")}>
                                <HighlightOffIcon id="iconButtonActiveInner" />
                            </IconButton>
                            :
                            <IconButton id="iconButton" variant="contained" onClick={() => props.setActiveTool("eraser")}>
                                <HighlightOffIcon id="iconButtonInner" />
                            </IconButton>
                    }
                </Tooltip>

            </div>
            {
                displayExtraTools ?
                    <div className="extratools" >
                        <Tooltip id="tooltip" title="line" TransitionProps={{ timeout: 0 }} placement="bottom">
                            {
                                props.activeTool === "line" ?
                                    <IconButton id="iconButtonActive" variant="contained" onClick={() => setDisplayExtraTools(false)}>
                                        <RemoveIcon id="iconButtonActiveInner" />
                                    </IconButton>
                                    :
                                    <IconButton id="iconButton" variant="contained" onClick={() => props.setActiveTool("line")}>
                                        <RemoveIcon id="iconButtonInner" />
                                    </IconButton>
                            }
                        </Tooltip>
                        <Tooltip id="tooltip" title="triangle" TransitionProps={{ timeout: 0 }} placement="bottom">
                            {
                                props.activeTool === "triangle" ?
                                    <IconButton id="iconButtonActive" variant="contained" onClick={() => setDisplayExtraTools(false)}>
                                        <ChangeHistoryIcon id="iconButtonActiveInner" />
                                    </IconButton>
                                    :
                                    <IconButton id="iconButton" variant="contained" onClick={() => props.setActiveTool("triangle")}>
                                        <ChangeHistoryIcon id="iconButtonInner" />
                                    </IconButton>
                            }
                        </Tooltip>
                        <Tooltip id="tooltip" title="circle" TransitionProps={{ timeout: 0 }} placement="bottom">
                            {
                                props.activeTool === "circle" ?
                                    <IconButton id="iconButtonActive" variant="contained" onClick={() => setDisplayExtraTools(false)}>
                                        <RadioButtonUncheckedIcon id="iconButtonActiveInner" />
                                    </IconButton>
                                    :
                                    <IconButton id="iconButton" variant="contained" onClick={() => props.setActiveTool("circle")}>
                                        <RadioButtonUncheckedIcon id="iconButtonInner" />
                                    </IconButton>
                            }
                        </Tooltip>
                    </div>
                    :
                    null
            }
            <div>
                <Tooltip id="tooltip" title="choose color" TransitionProps={{ timeout: 0 }} placement="bottom">
                    <IconButton id="iconButton" variant="contained" onClick={handlePaletteClick}>
                        <PaletteIcon id="iconButtonInner" />
                    </IconButton>
                </Tooltip>
                { // Palette Popup
                    displayColorPicker ?
                        <div className="popup">
                            <div className="cover" onClick={handlePaletteClose} />
                            <div className="colorpicker">
                                <SketchPicker disableAlpha={true} color={color} onChange={handlePaletteChange} />
                            </div>
                        </div>
                        : null
                }
            </div>
            <div>
                <Tooltip id="tooltip" title="choose width" TransitionProps={{ timeout: 0 }} placement="bottom">
                    <IconButton id="iconButton" variant="contained" onClick={handleWidthClick}>
                        <CreateIcon id="iconButtonInner" />
                    </IconButton>
                </Tooltip>
                { // Width Slider Popup
                    displayWidthPicker ?
                        <div className="popup">
                            <div className="cover" onClick={handleWidthClose} />
                            <div className="widthpicker">
                                <Slider
                                    value={typeof props.lineWidth === 'number' ? props.lineWidth : 0}
                                    onChange={handleSliderChange}
                                    aria-labelledby="input-slider"
                                    min={minWidth}
                                    max={maxWidth}
                                />
                                <Input
                                    value={props.lineWidth}
                                    margin="dense"
                                    onChange={handleInputChange}
                                    onBlur={handleBlur}
                                    inputProps={{
                                        step: 10,
                                        min: minWidth,
                                        max: maxWidth,
                                        type: 'number',
                                        'aria-labelledby': 'input-slider',
                                    }}
                                />
                            </div>
                        </div>
                        : null
                }
            </div>
        </div>
    );
}
export default Toolbar;