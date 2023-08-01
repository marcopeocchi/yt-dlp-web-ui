import Brightness4 from '@mui/icons-material/Brightness4'
import Brightness5 from '@mui/icons-material/Brightness5'
import BrightnessAuto from '@mui/icons-material/BrightnessAuto'
import { ListItemButton, ListItemIcon, ListItemText } from '@mui/material'
import { useRecoilState } from 'recoil'
import { Theme, themeState } from '../atoms/settings'

const ThemeToggler: React.FC = () => {
  const [theme, setTheme] = useRecoilState(themeState)

  const actions: Record<Theme, React.ReactNode> = {
    system: <BrightnessAuto />,
    light: <Brightness4 />,
    dark: <Brightness5 />,
  }

  const themes: Theme[] = ['system', 'light', 'dark']
  const currentTheme = themes.indexOf(theme)

  return (
    <ListItemButton onClick={() => {
      setTheme(themes[(currentTheme + 1) % themes.length])
    }}>
      <ListItemIcon>
        {actions[theme]}
      </ListItemIcon>
      <ListItemText primary="Toggle theme" />
    </ListItemButton>
  )
}

export default ThemeToggler