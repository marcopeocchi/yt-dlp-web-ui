import {
  Container
} from '@mui/material'
import Downloads from '../components/Downloads'
import HomeActions from '../components/HomeActions'
import LoadingBackdrop from '../components/LoadingBackdrop'
import Splash from '../components/Splash'

export default function Home() {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <LoadingBackdrop />
      <Splash />
      <Downloads />
      <HomeActions />
    </Container>
  )
}
