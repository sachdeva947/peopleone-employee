import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit() {
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters!')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match!')
      return
    }

    setLoading(true)

    // Find portal user by reset token
    const { data: portalUser, error: fetchError } = await supabase
      .from('employee_portal_users')
      .select('*, employees(first_name, employee_code)')
      .eq('reset_token', token)
      .gt('reset_token_expiry', new Date().toISOString())
      .single()

    if (fetchError || !portalUser) {
      setError('Invalid or expired link. Please contact HR.')
      setLoading(false)
      return
    }

    // Simple hash — in production use proper bcrypt
    // For now store as plain (upgrade later with Edge Function)
    const { error: updateError } = await supabase
      .from('employee_portal_users')
      .update({
        password_hash: password,
        reset_token: null,
        reset_token_expiry: null,
        first_login: false,
        is_active: true,
      })
      .eq('id', portalUser.id)

    if (updateError) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)

    // Redirect to login after 2 seconds
    setTimeout(() => navigate('/login'), 2000)
  }

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

  if (success) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow p-10 text-center max-w-md">
        <p className="text-5xl mb-4">🎉</p>
        <h2 className="text-xl font-bold text-green-600 mb-2">Password Set!</h2>
        <p className="text-gray-500">Redirecting to login...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-900 text-white py-5 px-6 text-center">
        <h1 className="text-2xl font-bold">PeopleOne</h1>
        <p className="text-blue-300 text-sm">Employee Self-Service Portal</p>
      </div>

      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow p-8">
          <h2 className="text-xl font-bold text-blue-900 mb-2">Set Your Password</h2>
          <p className="text-gray-400 text-sm mb-6">
            Choose a strong password for your account.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                New Password *
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={inputClass}
                placeholder="Minimum 8 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Confirm Password *
              </label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className={inputClass}
                placeholder="Re-enter password"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || !password || !confirm}
              className="w-full bg-blue-900 text-white py-3 rounded-lg font-medium hover:bg-blue-800 disabled:opacity-50 transition">
              {loading ? 'Setting Password...' : '🔐 Set Password'}
            </button>
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-blue-700 text-xs">
              💡 Password tips:
            </p>
            <ul className="text-blue-600 text-xs mt-1 space-y-0.5">
              <li>• Minimum 8 characters</li>
              <li>• Mix of letters and numbers</li>
              <li>• Avoid using your name or DOB</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword