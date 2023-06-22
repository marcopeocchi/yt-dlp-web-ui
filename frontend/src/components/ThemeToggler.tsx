import { ListItemButton, ListItemIcon, ListItemText } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { setTheme } from '../features/settings/settingsSlice'
import { RootState } from '../stores/store'
import { Brightness4, Brightness5 } from '@mui/icons-material'

export default function ThemeToggler() {
  const settings = useSelector((state: RootState) => state.settings)
  const dispatch = useDispatch()

  return (
    <ListItemButton onClick={() => {
      settings.theme === 'light'
        ? dispatch(setTheme('dark'))
        : dispatch(setTheme('light'))
    }}>
      <ListItemIcon>
        {
          settings.theme === 'light'
            ? <Brightness4 />
            : <Brightness5 />
        }
      </ListItemIcon>
      <ListItemText primary="Toggle theme" />
    </ListItemButton>
  )
}