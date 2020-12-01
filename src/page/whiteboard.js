import React, { useEffect, useState } from 'react';
import * as evl from '../util/eventlistener.js';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import { IconButton } from '@material-ui/core';
import ClearIcon from '@material-ui/icons/Clear';
import DeleteIcon from '@material-ui/icons/Delete';
import AddIcon from '@material-ui/icons/Add';
import reactCSS from 'reactcss'

function Whiteboard(props) {
    const [displayPageSettings, setDisplayPageSettings] = useState(false);

    function mousedown(e){
        if (props.isDrawModeRef.current) {
            evl.handleCanvasMouseDown(e, props.canvasRef, props.scaleRef)
        }
    } 
    function mousemove(e){
        if (props.isDrawModeRef.current) {
            evl.handleCanvasMouseMove(e, props.canvasRef, props.scaleRef);
        }
    } 
    function mouseup(e){
        if (props.isDrawModeRef.current) {
            evl.handleCanvasMouseUp(e, props.pageId, props.canvasRef, props.wsRef, 
                props.setStrokeCollection, props.setHitboxCollection, props.setUndoStack, props.scaleRef);
        }
        
    } 
    function mouseleave(e){
        if (props.isDrawModeRef.current) {
            evl.handleCanvasMouseLeave(e, props.pageId, props.canvasRef, props.wsRef, 
                props.setStrokeCollection, props.setHitboxCollection, props.setUndoStack, props.scaleRef);
        }
    } 


    useEffect(() => {
        const canvas = props.canvasRef.current;
        canvas.width = 620; //canvas.clientWidth;
        canvas.height = 877; //canvas.clientHeight;
        canvas.addEventListener("contextmenu", e => e.preventDefault()); // Disable Context Menu
        canvas.addEventListener("mousedown", (e) => mousedown(e));
        canvas.addEventListener("mousemove", (e) => mousemove(e));
        canvas.addEventListener("mouseup", (e) => mouseup(e));
        canvas.addEventListener("mouseleave", (e) => mouseleave(e));
        // touch & stylus support
        canvas.addEventListener("touchstart", (e) => mousedown(e));
        canvas.addEventListener("touchmove", (e) => mousemove(e));
        canvas.addEventListener("touchend", (e) => mouseup(e));
        canvas.addEventListener("touchcancel", (e) => mouseleave(e));

        return () => {
            canvas.removeEventListener("contextmenu", null);
            canvas.removeEventListener("mousedown", null);
            canvas.removeEventListener("mouseup", null);
            canvas.removeEventListener("mousemove", null);
            canvas.removeEventListener("mouseleave", null);
            // touch & stylus support
            canvas.removeEventListener("touchstart", null);
            canvas.removeEventListener("touchmove", null);
            canvas.removeEventListener("touchend", null);
            canvas.removeEventListener("touchcancel", null);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const styles = reactCSS({
        'default': {
            popover: {
                position: 'relative',
                zIndex: '2', // stack order
            },
            cover: {
                position: 'fixed',
                top: '0px',
                right: '0px',
                bottom: '0px',
                left: '0px',
            },
        },
    });

    function openPageSettings() {
        setDisplayPageSettings(true);
    }

    function closePageSettings() {
        setDisplayPageSettings(false);
    }

    function clearPage() {
        console.log("This should clear the page");
        console.log(props.scaleRef);
    }

    function addPage() {
        console.log("This should add a page");
    }

    return (
        <div className="page">
            <canvas ref={props.canvasRef} />
            <div>
                <IconButton id="iconButton" variant="contained" onClick={openPageSettings}>
                    <MoreVertIcon color="secondary" id="iconButtonInner" />
                </IconButton>
                { // Palette Popup
                    displayPageSettings ?
                        <div style={styles.popover}>
                            <div style={styles.cover} onClick={closePageSettings} />
                            <div className="pagesettings">
                                <IconButton id="iconButton" variant="contained" onClick={() => props.deletePage(props.pageId)}>
                                    <DeleteIcon color="secondary" id="iconButtonInner"/>
                                </IconButton>
                                <IconButton id="iconButton" variant="contained" onClick={clearPage}>
                                    <ClearIcon color="secondary" id="iconButtonInner"/>
                                </IconButton>
                                <IconButton id="iconButton" variant="contained" onClick={addPage}>
                                    <AddIcon color="secondary" id="iconButtonInner"/>
                                </IconButton>
                            </div>
                        </div>
                        : null
                }
            </div>
        </div>
    );
}

export default Whiteboard;