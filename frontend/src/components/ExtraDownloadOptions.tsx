import { Autocomplete, Box, TextField, Typography } from '@mui/material'
import { useRecoilState, useRecoilValue } from 'recoil'
import { customArgsState, savedTemplatesState } from '../atoms/downloadTemplate'
import { useI18n } from '../hooks/useI18n'

const ExtraDownloadOptions: React.FC = () => {
  const { i18n } = useI18n()

  const customTemplates = useRecoilValue(savedTemplatesState)
  const [, setCustomArgs] = useRecoilState(customArgsState)

  return (
    <>
      <Autocomplete
        disablePortal
        options={customTemplates.map(({ name, content }) => ({ label: name, content }))}
        autoHighlight
        getOptionLabel={(option) => option.label}
        onChange={(_, value) => {
          setCustomArgs(value?.content!)
        }}
        renderOption={(props, option) => (
          <Box
            component="li"
            sx={{ mr: 2, flexShrink: 0 }}
            {...props}>
            {option.label}
          </Box>
        )}
        sx={{ width: '100%', mt: 2 }}
        renderInput={(params) => <TextField {...params} label={i18n.t('savedTemplates')} />}
      />
    </>
  )
}

export default ExtraDownloadOptions