import { ListItemButton, ListItemIcon, ListItemText } from '@mui/material'
import LogoutIcon from '@mui/icons-material/Logout'
import { useNavigate } from 'react-router-dom'
import { useRecoilValue } from 'recoil'
import { serverURL } from '../atoms/settings'

export default function Logout() {
  const navigate = useNavigate()
  const url = useRecoilValue(serverURL)

  const logout = async () => {
    const res = await fetch(`${url}/auth/logout`)
    if (res.ok) {
      navigate('/login')
    }
  }

  return (
    <ListItemButton onClick={logout}>
      <ListItemIcon>
        <LogoutIcon />
      </ListItemIcon>
      <ListItemText primary="RPC authentication" />
    </ListItemButton>
  )
}