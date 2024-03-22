import SettingsEthernet from '@mui/icons-material/SettingsEthernet'
import { AppBar, Toolbar } from '@mui/material'
import { Suspense } from 'react'
import { useRecoilValue } from 'recoil'
import { settingsState } from '../atoms/settings'
import { connectedState } from '../atoms/status'
import { useI18n } from '../hooks/useI18n'
import FreeSpaceIndicator from './FreeSpaceIndicator'
import VersionIndicator from './VersionIndicator'

const Footer: React.FC = () => {
  const settings = useRecoilValue(settingsState)
  const isConnected = useRecoilValue(connectedState)

  const mode = settings.theme
  const { i18n } = useI18n()

  return (
    <AppBar position="fixed" color="default" sx={{
      top: 'auto',
      bottom: 0,
      height: 48,
      zIndex: 1200,
      borderTop: mode === 'light'
        ? '1px solid rgba(0, 0, 0, 0.12)'
        : '1px solid rgba(255, 255, 255, 0.12)',
    }}>
      <Toolbar sx={{
        paddingBottom: 2,
        fontSize: 14,
        display: 'flex', gap: 1, justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', gap: 2 }}>
          <div>RPC v3.0.6</div>
          <div></div>
          <VersionIndicator />
        </div>
        <div style={{ display: 'flex', gap: 1, 'alignItems': 'center' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            marginRight: '8px',
            gap: 3,
          }}>
            <SettingsEthernet />
            <span>
              {isConnected ? settings.serverAddr : i18n.t('notConnectedText')}
            </span>
          </div>
          <Suspense fallback={i18n.t('loadingLabel')}>
            <FreeSpaceIndicator />
          </Suspense>
        </div>
      </Toolbar>
    </AppBar>
  )
}

export default Footer