'use client'
import { createTheme } from "@mui/material";

const theme = createTheme({
    palette: {
        primary: {
            main: '#1C1C1C',
            light: '#D3D3D3',
            dark: '#2F4F4F'
        },
        secondary: {
            main: '#DC143C',
            light: '#FF5A71',
            dark: '#A0102A',
        },
        accent: {
            main: '#FFD700',
            light: '#FFE680',
            dark: '#B58F00',
        }
    }
})

export default theme;
