import { Grid } from '@mui/material'
import { useRecoilValue } from 'recoil'
import { activeDownloadsState } from '../atoms/downloads'
import { useToast } from '../hooks/toast'
import { useI18n } from '../hooks/useI18n'
import { useRPC } from '../hooks/useRPC'
import { ProcessStatus, RPCResult } from '../types'
import DownloadCard from './DownloadCard'

const DownloadsGridView: React.FC = () => {
  const downloads = useRecoilValue(activeDownloadsState)

  const { i18n } = useI18n()
  const { client } = useRPC()
  const { pushMessage } = useToast()

  const stop = (r: RPCResult) => r.progress.process_status === ProcessStatus.COMPLETED
    ? client.clear(r.id)
    : client.kill(r.id)

  return (
    <Grid container spacing={{ xs: 2, md: 2 }} columns={{ xs: 4, sm: 8, md: 12, xl: 12 }} pt={2}>
      {
        downloads.map(download => (
          <Grid item xs={4} sm={8} md={6} xl={4} key={download.id}>
            <DownloadCard
              download={download}
              onStop={() => stop(download)}
              onCopy={() => pushMessage(i18n.t('clipboardAction'), 'info')}
            />
          </Grid>
        ))
      }
    </Grid>
  )
}

export default DownloadsGridView