import CloudDownloadIcon from '@mui/icons-material/CloudDownload'
import { Container, SvgIcon, Typography, styled } from '@mui/material'
import { useContext } from 'react'
import { I18nContext } from '../providers/i18nProvider'

const FlexContainer = styled(Container)({
  display: 'flex',
  minWidth: '100%',
  minHeight: '80vh',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column'
})

const Title = styled(Typography)({
  display: 'flex',
  width: '100%',
  alignItems: 'center',
  justifyContent: 'center',
  paddingBottom: '0.5rem'
})

export default function Splash() {
  const { i18n } = useContext(I18nContext)

  return (
    <FlexContainer>
      <Title fontWeight={'500'} fontSize={72} color={'gray'}>
        <SvgIcon sx={{ fontSize: '200px' }}>
          <CloudDownloadIcon />
        </SvgIcon>
      </Title>
      <Title fontWeight={'500'} fontSize={36} color={'gray'}>
        {i18n.t('splashText')}
      </Title>
    </FlexContainer>
  )
}