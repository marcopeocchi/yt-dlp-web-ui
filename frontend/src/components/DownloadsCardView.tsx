import { Grid } from "@mui/material"
import { Fragment } from "react"

import type { RPCResult } from "../types"
import { StackableResult } from "./StackableResult"

type Props = {
  downloads: RPCResult[]
  abortFunction: Function
}

export function DownloadsCardView({ downloads, abortFunction }: Props) {
  return (
    <Grid container spacing={{ xs: 2, md: 2 }} columns={{ xs: 4, sm: 8, md: 12 }} pt={2}>
      {
        downloads.map(download => (
          <Grid item xs={4} sm={8} md={6} key={download.id}>
            <Fragment>
              <StackableResult
                title={download.info.title}
                thumbnail={download.info.thumbnail}
                percentage={download.progress.percentage}
                stopCallback={() => abortFunction(download.id)}
                resolution={download.info.resolution ?? ''}
                speed={download.progress.speed}
                size={download.info.filesize_approx ?? 0}
              />
            </Fragment>
          </Grid>
        ))
      }
    </Grid>
  )
}