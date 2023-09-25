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
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRecoilValue } from 'recoil'
import { serverURL } from '../atoms/settings'

const LoginContainer = styled(Container)({
  display: 'flex',
  minWidth: '100%',
  minHeight: '85vh',
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
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const [formHasError, setFormHasError] = useState(false)

  const url = useRecoilValue(serverURL)

  const navigate = useNavigate()

  const navigateAndReload = () => {
    navigate('/')
    window.location.reload()
  }

  const login = async () => {
    const res = await fetch(`${url}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username,
        password,
      })
    })
    res.ok ? navigateAndReload() : setFormHasError(true)
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
            In order to enable RPC authentication append the --auth,
            <br />
            --user [username] and --pass [password] flags.
          </Title>
          <TextField
            label="Username"
            type="text"
            autoComplete="yt-dlp-webui-username"
            error={formHasError}
            onChange={e => setUsername(e.currentTarget.value)}
          />
          <TextField
            label="Password"
            type="password"
            autoComplete="yt-dlp-webui-password"
            error={formHasError}
            onChange={e => setPassword(e.currentTarget.value)}
          />
          <Button variant="contained" size="large" onClick={() => login()}>
            Submit
          </Button>
        </Stack>
      </Paper>
    </LoginContainer>
  )
}