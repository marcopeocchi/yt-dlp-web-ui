import { Grid, Snackbar } from "@mui/material"
import { Fragment, useContext, useEffect, useState } from "react"
import type { RPCResult } from "../types"
import { StackableResult } from "./StackableResult"
import { I18nContext } from "../providers/i18nProvider"

type Props = {
  downloads: RPCResult[]
  onStop: (id: string) => void
}

export function DownloadsCardView({ downloads, onStop }: Props) {
  const [openSB, setOpenSB] = useState(false)

  const { i18n } = useContext(I18nContext)

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
                onCopy={() => setOpenSB(true)}
                resolution={download.info.resolution ?? ''}
                speed={download.progress.speed}
                size={download.info.filesize_approx ?? 0}
                status={download.progress.process_status}
              />
            </Fragment>
          </Grid>
        ))
      }
      <Snackbar
        open={openSB}
        autoHideDuration={1250}
        onClose={() => setOpenSB(false)}
        message={i18n.t('clipboardAction')}
      />
    </Grid>
  )
}