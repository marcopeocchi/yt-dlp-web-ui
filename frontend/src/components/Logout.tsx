import { ListItemButton, ListItemIcon, ListItemText } from '@mui/material'
import LogoutIcon from '@mui/icons-material/Logout'
import { getHttpEndpoint } from '../utils'
import { useNavigate } from 'react-router-dom'

export default function Logout() {
  const navigate = useNavigate()

  const logout = async () => {
    const res = await fetch(`${getHttpEndpoint()}/auth/logout`)
    if (res.ok) {
      navigate('/login')
    }
  }

  return (
    <ListItemButton onClick={logout}>
      <ListItemIcon>
        <LogoutIcon />
      </ListItemIcon>
      <ListItemText primary="Authentication" />
    </ListItemButton>
  )
}