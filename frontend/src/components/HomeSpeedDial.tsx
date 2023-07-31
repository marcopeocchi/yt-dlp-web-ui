import AddCircleIcon from '@mui/icons-material/AddCircle'
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
  onOpen: () => void
}

const HomeSpeedDial: React.FC<Props> = ({ onOpen }) => {
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
        icon={<AddCircleIcon />}
        tooltipTitle={`New download`}
        onClick={onOpen}
      />
    </SpeedDial>
  )
}

export default HomeSpeedDial