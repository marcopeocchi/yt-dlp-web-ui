import AddCircleIcon from '@mui/icons-material/AddCircle'
import BuildCircleIcon from '@mui/icons-material/BuildCircle'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import FormatListBulleted from '@mui/icons-material/FormatListBulleted'
import {
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon
} from '@mui/material'
import { useRecoilState } from 'recoil'
import { listViewState } from '../atoms/settings'
import { useI18n } from '../hooks/useI18n'
import { useRPC } from '../hooks/useRPC'

type Props = {
  onDownloadOpen: () => void
  onEditorOpen: () => void
}

const HomeSpeedDial: React.FC<Props> = ({ onDownloadOpen, onEditorOpen }) => {
  const [, setListView] = useRecoilState(listViewState)

  const { i18n } = useI18n()
  const { client } = useRPC()

  const abort = () => client.killAll()

  return (
    <SpeedDial
      ariaLabel="Home speed dial"
      sx={{ position: 'absolute', bottom: 32, right: 32 }}
      icon={<SpeedDialIcon />}
    >
      <SpeedDialAction
        icon={<FormatListBulleted />}
        tooltipTitle={`Table view`}
        onClick={() => setListView(state => !state)}
      />
      <SpeedDialAction
        icon={<DeleteForeverIcon />}
        tooltipTitle={i18n.t('abortAllButton')}
        onClick={abort}
      />
      <SpeedDialAction
        icon={<BuildCircleIcon />}
        tooltipTitle={i18n.t('templatesEditor')}
        onClick={onEditorOpen}
      />
      <SpeedDialAction
        icon={<AddCircleIcon />}
        tooltipTitle={i18n.t('newDownload')}
        onClick={onDownloadOpen}
      />
    </SpeedDial>
  )
}

export default HomeSpeedDial