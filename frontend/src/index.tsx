import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import './assets/css/th-bank.css'
import App from './App'
import { store } from './store'

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <App />
  </Provider>,
)
