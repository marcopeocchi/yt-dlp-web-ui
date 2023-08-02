import { Grid } from '@mui/material'
import { useRecoilValue } from 'recoil'
import { activeDownloadsState } from '../atoms/downloads'
import { useToast } from '../hooks/toast'
import { useI18n } from '../hooks/useI18n'
import { useRPC } from '../hooks/useRPC'
import DownloadCard from './DownloadCard'

const DownloadsCardView: React.FC = () => {
  const downloads = useRecoilValue(activeDownloadsState) ?? []

  const { i18n } = useI18n()
  const { client } = useRPC()
  const { pushMessage } = useToast()

  const abort = (id: string) => client.kill(id)

  return (
    <Grid container spacing={{ xs: 2, md: 2 }} columns={{ xs: 4, sm: 8, md: 12 }} pt={2}>
      {
        downloads.map(download => (
          <Grid item xs={4} sm={8} md={6} key={download.id}>
            <>
              <DownloadCard
                download={download}
                onStop={() => abort(download.id)}
                onCopy={() => pushMessage(i18n.t('clipboardAction'), 'info')}
              />
            </>
          </Grid>
        ))
      }
    </Grid>
  )
}

export default DownloadsCardView