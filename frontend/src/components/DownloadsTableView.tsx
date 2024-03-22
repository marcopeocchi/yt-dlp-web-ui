import DeleteIcon from '@mui/icons-material/Delete'
import DownloadIcon from '@mui/icons-material/Download'
import DownloadDoneIcon from '@mui/icons-material/DownloadDone'
import StopCircleIcon from '@mui/icons-material/StopCircle'
import {
  Box,
  Grid,
  IconButton,
  LinearProgress,
  LinearProgressProps,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from "@mui/material"
import { useRecoilValue } from 'recoil'
import { activeDownloadsState } from '../atoms/downloads'
import { useRPC } from '../hooks/useRPC'
import { formatSize, formatSpeedMiB } from "../utils"

function LinearProgressWithLabel(props: LinearProgressProps & { value: number }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress variant="determinate" {...props} />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2" color="text.secondary">{`${Math.round(
          props.value,
        )}%`}</Typography>
      </Box>
    </Box>
  )
}

const DownloadsTableView: React.FC = () => {
  const downloads = useRecoilValue(activeDownloadsState)

  const { client } = useRPC()

  const abort = (id: string) => client.kill(id)

  return (
    <Grid container spacing={{ xs: 2, md: 2 }} columns={{ xs: 4, sm: 8, md: 12 }} pt={2}>
      <Grid item xs={12}>
        <TableContainer
          component={Paper}
          sx={{ minHeight: '80vh' }}
          elevation={2}
          hidden={downloads.length === 0}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width={8}>
                  <Typography fontWeight={500} fontSize={13}>Status</Typography>
                </TableCell>
                <TableCell>
                  <Typography fontWeight={500} fontSize={13}>Title</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight={500} fontSize={13}>Speed</Typography>
                </TableCell>
                <TableCell align="center" width={200}>
                  <Typography fontWeight={500} fontSize={13}>Progress</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight={500} fontSize={13}>Size</Typography>
                </TableCell>
                <TableCell align="right" width={180}>
                  <Typography fontWeight={500} fontSize={13}>Added on</Typography>
                </TableCell>
                <TableCell align="right" width={8}>
                  <Typography fontWeight={500} fontSize={13}>Actions</Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {
                downloads.map(download => (
                  <TableRow key={download.id}>
                    <TableCell>
                      {download.progress.percentage === '-1'
                        ? <DownloadDoneIcon color="primary" />
                        : <DownloadIcon color="primary" />
                      }
                    </TableCell>
                    <TableCell>{download.info.title}</TableCell>
                    <TableCell align="right">{formatSpeedMiB(download.progress.speed)}</TableCell>
                    <TableCell align="right">
                      <LinearProgressWithLabel
                        sx={{ height: '16px' }}
                        value={
                          download.progress.percentage === '-1'
                            ? 100
                            : Number(download.progress.percentage.replace('%', ''))
                        }
                        variant={
                          download.progress.process_status === 0
                            ? 'indeterminate'
                            : 'determinate'
                        }
                        color={download.progress.percentage === '-1' ? 'primary' : 'primary'}
                      />
                    </TableCell>
                    <TableCell align="right">{formatSize(download.info.filesize_approx ?? 0)}</TableCell>
                    <TableCell align="right">
                      {new Date(download.info.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => abort(download.id)}
                      >
                        {download.progress.percentage === '-1' ? <DeleteIcon /> : <StopCircleIcon />}

                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </Grid>
  )
}

export default DownloadsTableView