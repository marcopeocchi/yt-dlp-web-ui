import {
  Container
} from '@mui/material'
import Downloads from '../components/Downloads'
import HomeActions from '../components/HomeActions'
import LoadingBackdrop from '../components/LoadingBackdrop'
import Splash from '../components/Splash'

export default function Home() {
  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 8 }}>
      <LoadingBackdrop />
      <Splash />
      <Downloads />
      <HomeActions />
    </Container>
  )
}
