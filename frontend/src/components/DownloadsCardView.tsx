import { Grid } from "@mui/material"
import { Fragment } from "react"
import { useRecoilValue } from 'recoil'
import { activeDownloadsState } from '../atoms/downloads'
import { useToast } from "../hooks/toast"
import { useI18n } from '../hooks/useI18n'
import { useRPC } from '../hooks/useRPC'
import { StackableResult } from "./StackableResult"

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
            <Fragment>
              <StackableResult
                url={download.info.url}
                title={download.info.title}
                thumbnail={download.info.thumbnail}
                percentage={download.progress.percentage}
                onStop={() => abort(download.id)}
                onCopy={() => pushMessage(i18n.t('clipboardAction'), 'info')}
                resolution={download.info.resolution ?? ''}
                speed={download.progress.speed}
                size={download.info.filesize_approx ?? 0}
                status={download.progress.process_status}
              />
            </Fragment>
          </Grid>
        ))
      }
    </Grid>
  )
}

export default DownloadsCardView