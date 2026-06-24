import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Onboard from './pages/Onboard'
import ResetPassword from './pages/ResetPassword'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/onboard/:token" element={<Onboard />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
              </Routes>
    </BrowserRouter>
  )
}

export default App