'use client'

import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles'
import type { ReactNode } from 'react'

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#f97316',
    },
  },
})

interface ThemeProviderProps {
  children: ReactNode
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <MuiThemeProvider theme={darkTheme}>
      {children}
    </MuiThemeProvider>
  )
}

