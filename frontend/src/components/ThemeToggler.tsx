import { Brightness4, Brightness5 } from '@mui/icons-material'
import { ListItemButton, ListItemIcon, ListItemText } from '@mui/material'
import { useRecoilState } from 'recoil'
import { themeState } from '../atoms/settings'

export default function ThemeToggler() {
  const [theme, setTheme] = useRecoilState(themeState)

  return (
    <ListItemButton onClick={() => {
      theme === 'light'
        ? setTheme('dark')
        : setTheme('light')
    }}>
      <ListItemIcon>
        {
          theme === 'light'
            ? <Brightness4 />
            : <Brightness5 />
        }
      </ListItemIcon>
      <ListItemText primary="Toggle theme" />
    </ListItemButton>
  )
}