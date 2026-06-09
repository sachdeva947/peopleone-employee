import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Onboard from './pages/Onboard'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/onboard/:token" element={<Onboard />} />
        <Route path="*" element={
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-blue-900">PeopleOne</h1>
              <p className="text-gray-500 mt-2">Employee Self-Service Portal</p>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App