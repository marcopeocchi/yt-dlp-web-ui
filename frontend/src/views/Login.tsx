/*
  Login view component
*/

import styled from '@emotion/styled'
import {
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import { getHttpEndpoint } from '../utils'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const LoginContainer = styled(Container)({
  display: 'flex',
  minWidth: '100%',
  minHeight: '100vh',
  alignItems: 'center',
  justifyContent: 'center',
})

const Title = styled(Typography)({
  display: 'flex',
  width: '100%',
  alignItems: 'center',
  justifyContent: 'center',
  paddingBottom: '0.5rem'
})

export default function Login() {
  const [secret, setSecret] = useState('')
  const [formHasError, setFormHasError] = useState(false)

  const navigate = useNavigate()

  const login = async () => {
    const res = await fetch(`${getHttpEndpoint()}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ secret })
    })
    res.ok ? navigate('/') : setFormHasError(true)
  }

  return (
    <LoginContainer>
      <Paper sx={{ padding: '1.5rem', minWidth: '25%' }}>
        <Stack direction="column" spacing={2}>
          <Title fontWeight={'700'} fontSize={32} color={'primary'}>
            yt-dlp WebUI
          </Title>
          <Title fontWeight={'500'} fontSize={16} color={'gray'}>
            Authentication token will expire after 30 days.
          </Title>
          <Title fontWeight={'500'} fontSize={16} color={'gray'}>
            In order to enable RPC authentication append the --auth
            <br />
            and --secret [secret] flags.
          </Title>
          <TextField
            id="outlined-password-input"
            label="RPC secret"
            type="password"
            autoComplete="current-password"
            error={formHasError}
            onChange={e => setSecret(e.currentTarget.value)}
          />
          <Button variant="contained" size="large" onClick={() => login()}>
            Submit
          </Button>
        </Stack>
      </Paper>
    </LoginContainer>
  )
}