// theme.ts
import { DefaultTheme } from "styled-components"

export const darkTheme: DefaultTheme = {
    palette: {
        primary: {
            main: "#424242",
            contrastText: "#E0E0E0",
        },
        secondary: {
            main: "#616161",
            contrastText: "#ffffff",
        },
        editor: {
            background: "#757575",
            paper: "#f9fbff",
            selected: "#212121",
        },
        common: {
            warning: "#ff0000",
            rule: "#00000022",
        },
    },
}
