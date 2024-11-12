import { Autocomplete, Box, TextField, Typography } from '@mui/material'
import { customArgsState, savedTemplatesState } from '../atoms/downloadTemplate'
import { useI18n } from '../hooks/useI18n'
import { useAtom, useAtomValue } from 'jotai'

const ExtraDownloadOptions: React.FC = () => {
  const { i18n } = useI18n()

  const customTemplates = useAtomValue(savedTemplatesState)
  const [, setCustomArgs] = useAtom(customArgsState)

  return (
    <>
      <Autocomplete
        disablePortal
        options={customTemplates.map(({ name, content }) => ({ label: name, content }))}
        autoHighlight
        defaultValue={
          customTemplates
            .filter(({ id, name }) => id === "0" || name === "default")
            .map(({ name, content }) => ({ label: name, content }))
            .at(0)
        }
        getOptionLabel={(option) => option.label}
        onChange={(_, value) => {
          setCustomArgs(value?.content!)
        }}
        renderOption={(props, option) => (
          <Box
            component="li"
            {...props}
          >
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignContent: 'flex-start',
              justifyContent: 'flex-start',
              alignItems: 'flex-start',
              width: '100%'
            }}>
              <Typography>
                {option.label}
              </Typography>
              <Typography variant="subtitle2" color="primary">
                {option.content}
              </Typography>
            </Box>
          </Box>
        )}
        sx={{ width: '100%', mt: 2 }}
        renderInput={(params) => <TextField {...params} label={i18n.t('savedTemplates')} />}
      />
    </>
  )
}

export default ExtraDownloadOptions