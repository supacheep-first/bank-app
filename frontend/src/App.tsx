import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import PinPage from './pin/PinPage'
import SplashPage from './splash/SplashPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SplashPage />} />
        <Route path="/pin" element={<PinPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
