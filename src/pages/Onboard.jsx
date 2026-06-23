import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function Onboard() {
  const { token } = useParams()
  const [step, setStep] = useState(1)
  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useStateconst [form, setForm] = useState({
  father_name: '', date_of_birth: '', gender: '',
  permanent_address: '', current_address: '',
  bank_name: '', bank_account_no: '', bank_ifsc: '',
  bank_account_type: 'savings', pan: '', aadhaar_last4: '',
  blood_group: '', work_experience: '',
})

  useEffect(() => {
    async function fetchEmployee() {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('onboarding_token', token)
        .single()

      if (error || !data) {
        setError('Invalid or expired onboarding link.')
      } else if (data.onboarding_completed_at) {
        setError('Onboarding already completed!')
      } else {
        setEmployee(data)
        setForm(prev => ({
          ...prev,
          father_name: data.father_name || '',
          date_of_birth: data.date_of_birth || '',
          gender: data.gender || '',
          pan: data.pan || '',
          aadhaar_last4: data.aadhaar_last4 || '',
          bank_name: data.bank_name || '',
          bank_account_no: data.bank_account_no || '',
          bank_ifsc: data.bank_ifsc || '',
        }))
      }
      setLoading(false)
    }
    fetchEmployee()
  }, [token])

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit() {
    setSaving(true)
    const { error } = await supabase
      .from('employees')
      .update({
        ...form,
        onboarding_completed_at: new Date().toISOString(),
        status: 'active',
        onboarding_token: null,
      })
      .eq('id', employee.id)

    setSaving(false)
    if (!error) setStep(4)
  }

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400 text-lg">Loading...</p>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow p-10 text-center max-w-md">
        <p className="text-5xl mb-4">❌</p>
        <p className="text-red-600 font-medium text-lg">{error}</p>
        <p className="text-gray-400 text-sm mt-2">Please contact your HR team.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-900 text-white py-5 px-6 text-center">
        <h1 className="text-2xl font-bold">PeopleOne</h1>
        <p className="text-blue-300 text-sm">Employee Onboarding</p>
      </div>

      <div className="max-w-xl mx-auto px-4 py-8">

        {/* Welcome */}
        {step !== 4 && (
          <div className="bg-white rounded-2xl shadow p-5 mb-6 text-center">
            <p className="text-gray-500 text-sm">Welcome,</p>
            <p className="text-xl font-bold text-blue-900">
              {employee.first_name} {employee.last_name || ''}
            </p>
            <p className="text-gray-400 text-sm">{employee.designation}</p>
          </div>
        )}

        {/* Steps indicator */}
        {step !== 4 && (
          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                  ${step === s ? 'bg-blue-900 text-white' : step > s ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {step > s ? '✓' : s}
                </div>
                {s < 3 && <div className={`w-8 h-1 rounded ${step > s ? 'bg-green-500' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        )}

        {/* Step 1 — Personal Details */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">Personal Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Father's Name</label>
                <input name="father_name" value={form.father_name} onChange={handleChange} className={inputClass} placeholder="Ram Kumar" />
              </div>
              <div>
              <div>
  <label className="block text-sm font-medium text-gray-600 mb-1">Blood Group</label>
  <select name="blood_group" value={form.blood_group} onChange={handleChange} className={inputClass}>
    <option value="">Select</option>
    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
      <option key={bg} value={bg}>{bg}</option>
    ))}
  </select>
</div>

<div>
  <label className="block text-sm font-medium text-gray-600 mb-1">Work Experience</label>
  <input
    name="work_experience"
    value={form.work_experience}
    onChange={handleChange}
    className={inputClass}
    placeholder="e.g. 2 Years"
  />
</div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Date of Birth</label>
                <input type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Gender</label>
                <select name="gender" value={form.gender} onChange={handleChange} className={inputClass}>
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Permanent Address</label>
                <textarea name="permanent_address" value={form.permanent_address} onChange={handleChange} rows={3} className={inputClass} placeholder="Full permanent address..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Current Address</label>
                <textarea name="current_address" value={form.current_address} onChange={handleChange} rows={3} className={inputClass} placeholder="Current address (if different)..." />
              </div>
            </div>
            <button onClick={() => setStep(2)}
              className="w-full mt-6 bg-blue-900 text-white py-3 rounded-lg font-medium hover:bg-blue-800 transition">
              Next →
            </button>
          </div>
        )}

        {/* Step 2 — Documents */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">Identity Documents</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">PAN Number</label>
                <input name="pan" value={form.pan} onChange={handleChange} className={inputClass} placeholder="ABCDE1234F" maxLength={10} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Aadhaar Last 4 Digits</label>
                <input name="aadhaar_last4" value={form.aadhaar_last4} onChange={handleChange} className={inputClass} placeholder="1234" maxLength={4} />
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-yellow-700 text-xs">📎 Document uploads (Aadhaar, PAN scan) will be enabled in next step by HR team.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(1)}
                className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-lg font-medium hover:bg-gray-50 transition">
                ← Back
              </button>
              <button onClick={() => setStep(3)}
                className="flex-1 bg-blue-900 text-white py-3 rounded-lg font-medium hover:bg-blue-800 transition">
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Bank Details */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">Bank Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Bank Name</label>
                <input name="bank_name" value={form.bank_name} onChange={handleChange} className={inputClass} placeholder="State Bank of India" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Account Number</label>
                <input name="bank_account_no" value={form.bank_account_no} onChange={handleChange} className={inputClass} placeholder="12345678901" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">IFSC Code</label>
                <input name="bank_ifsc" value={form.bank_ifsc} onChange={handleChange} className={inputClass} placeholder="SBIN0001234" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Account Type</label>
                <select name="bank_account_type" value={form.bank_account_type} onChange={handleChange} className={inputClass}>
                  <option value="savings">Savings</option>
                  <option value="current">Current</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(2)}
                className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-lg font-medium hover:bg-gray-50 transition">
                ← Back
              </button>
              <button onClick={handleSubmit} disabled={saving}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50">
                {saving ? 'Submitting...' : '✅ Submit'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4 — Success */}
        {step === 4 && (
          <div className="bg-white rounded-2xl shadow p-10 text-center">
            <p className="text-6xl mb-4">🎉</p>
            <h2 className="text-2xl font-bold text-green-600 mb-2">Onboarding Complete!</h2>
            <p className="text-gray-500">Thank you {employee.first_name}! Your details have been submitted successfully.</p>
            <p className="text-gray-400 text-sm mt-4">HR team will verify your details and activate your account.</p>
          </div>
        )}

      </div>
    </div>
  )
}

export default Onboard