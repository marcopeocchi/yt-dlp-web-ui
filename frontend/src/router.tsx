import { CircularProgress } from '@mui/material'
import { Suspense, lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import Layout from './Layout'

const Home = lazy(() => import('./views/Home'))
const Login = lazy(() => import('./views/Login'))
const Archive = lazy(() => import('./views/Archive'))
const Settings = lazy(() => import('./views/Settings'))

export const router = createBrowserRouter([
  {
    path: '/',
    Component: () => <Layout />,
    children: [
      {
        path: '/',
        element: (
          <Suspense fallback={<CircularProgress />}>
            <Home />
          </Suspense >
        )
      },
      {
        path: '/settings',
        element: (
          <Suspense fallback={<CircularProgress />}>
            <Settings />
          </Suspense >
        )
      },
      {
        path: '/archive',
        element: (
          <Suspense fallback={<CircularProgress />}>
            <Archive />
          </Suspense >
        )
      },
      {
        path: '/login',
        element: (
          <Suspense fallback={<CircularProgress />}>
            <Login />
          </Suspense >
        )
      },
    ]
  },
])