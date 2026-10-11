import { RouterProvider } from 'react-router'
import { router } from './router'
import './stores/themeStore' // applies the saved theme before first paint

const App = () => <RouterProvider router={router} />

export default App
