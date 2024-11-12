import { RouterProvider } from 'react-router-dom'
import { Provider } from 'jotai'
import { router } from './router'

export function App() {
  return (
    <Provider>
      <RouterProvider router={router} />
    </Provider>
  )
}