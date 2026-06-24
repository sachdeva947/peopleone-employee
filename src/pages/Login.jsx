import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ employee_code: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    setError('')
    if (!form.employee_code || !form.password) {
      setError('Please enter Employee ID and Password!')
      return
    }
    setLoading(true)

    // Find employee by code
    const { data: emp } = await supabase
      .from('employees')
      .select('id, first_name, last_name, employee_code, personal_email, status')
      .eq('employee_code', form.employee_code.toUpperCase())
      .single()

    if (!emp) {
      setError('Employee ID not found!')
      setLoading(false)
      return
    }

    // Find portal user
    const { data: portalUser } = await supabase
      .from('employee_portal_users')
      .select('*')
      .eq('employee_id', emp.id)
      .eq('is_active', true)
      .single()

    if (!portalUser) {
      setError('Portal access not activated. Please contact HR.')
      setLoading(false)
      return
    }

    // Check password
    if (portalUser.password_hash !== form.password) {
      setError('Invalid password!')
      setLoading(false)
      return
    }

    // Update last login
    await supabase
      .from('employee_portal_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', portalUser.id)

    // Store session in localStorage
    localStorage.setItem('portal_employee', JSON.stringify({
      id: emp.id,
      employee_code: emp.employee_code,
      first_name: emp.first_name,
      last_name: emp.last_name,
      email: emp.personal_email,
      portal_user_id: portalUser.id,
    }))

    setLoading(false)
    navigate('/dashboard')
  }

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-900 text-white py-5 px-6 text-center">
        <h1 className="text-2xl font-bold">PeopleOne</h1>
        <p className="text-blue-300 text-sm">Employee Self-Service Portal</p>
      </div>

      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow p-8">
          <h2 className="text-xl font-bold text-blue-900 mb-2">Employee Login</h2>
          <p className="text-gray-400 text-sm mb-6">
            Login with your Employee ID and password.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Employee ID *
              </label>
              <input
                type="text"
                value={form.employee_code}
                onChange={e => setForm({ ...form, employee_code: e.target.value })}
                className={inputClass}
                placeholder="EMP-0001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Password *
              </label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className={inputClass}
                placeholder="Enter your password"
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-blue-900 text-white py-3 rounded-lg font-medium hover:bg-blue-800 disabled:opacity-50 transition">
              {loading ? 'Logging in...' : '→ Login'}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-xs">
              Forgot password? Contact your HR team.
            </p>
          </div>
        </div>

        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-blue-700 text-xs font-medium">💡 Login Help:</p>
          <ul className="text-blue-600 text-xs mt-1 space-y-0.5">
            <li>• Employee ID format: EMP-0001</li>
            <li>• Password was set via welcome email link</li>
            <li>• Contact HR if you haven't received the email</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Login