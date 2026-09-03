import { Button, CircularProgress } from '@mui/material'
import { useI18n } from '../hooks/useI18n'
import { useRPC } from '../hooks/useRPC'
import { useState } from 'react'
import { useToast } from '../hooks/toast'

const UpdateDenoButton: React.FC = () => {
  const { i18n } = useI18n()
  const { client } = useRPC()
  const { pushMessage } = useToast()

  const [isLoading, setIsLoading] = useState(false)

  const updateDeno = () => {
    setIsLoading(true)
    client
      .updateDeno()
      .then(() => pushMessage(i18n.t('toastUpdatedDeno'), 'success'))
      .then(() => setIsLoading(false))
  }

  return (
    <Button
      variant="contained"
      endIcon={isLoading ? <CircularProgress size={16} color='secondary' /> : <></>}
      onClick={updateDeno}
    >
      {i18n.t('updateDenoButton')}
    </Button>
  )
}

export default UpdateDenoButton
