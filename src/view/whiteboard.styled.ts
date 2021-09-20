import styled from "styled-components"

export const WhiteboardStyled = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: var(--background);
    -webkit-touch-callout: none; /* prevent callout to copy image, etc when tap to hold */
    -webkit-text-size-adjust: none; /* prevent webkit from resizing text to fit */
    -webkit-user-select: none; /* prevent copy paste, to allow, change 'none' to 'text' */
    user-select: none;
    touch-action: none;
`
