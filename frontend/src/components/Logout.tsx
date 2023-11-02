import LogoutIcon from '@mui/icons-material/Logout'
import { ListItemButton, ListItemIcon, ListItemText } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useRecoilValue } from 'recoil'
import { serverURL } from '../atoms/settings'
import { useI18n } from '../hooks/useI18n'

export default function Logout() {
  const navigate = useNavigate()
  const url = useRecoilValue(serverURL)

  const logout = async () => {
    const res = await fetch(`${url}/auth/logout`)
    if (res.ok) {
      navigate('/login')
    }
  }

  const { i18n } = useI18n()

  return (
    <ListItemButton onClick={logout}>
      <ListItemIcon>
        <LogoutIcon />
      </ListItemIcon>
      <ListItemText primary={i18n.t('rpcAuthenticationLabel')} />
    </ListItemButton>
  )
}