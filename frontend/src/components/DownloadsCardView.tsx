import { Grid } from "@mui/material"
import { Fragment } from "react"
import { useToast } from "../hooks/toast"
import { useI18n } from '../hooks/useI18n'
import type { RPCResult } from "../types"
import { StackableResult } from "./StackableResult"

type Props = {
  downloads: RPCResult[]
  onStop: (id: string) => void
}

export function DownloadsCardView({ downloads, onStop }: Props) {
  const { i18n } = useI18n()
  const { pushMessage } = useToast()

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
                onStop={() => onStop(download.id)}
                onCopy={() => pushMessage(i18n.t('clipboardAction'))}
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