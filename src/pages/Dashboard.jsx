import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

function Dashboard() {
  const navigate = useNavigate()
  const [employee, setEmployee] = useState(null)
  const [activeTab, setActiveTab] = useState('home')
  const [payslips, setPayslips] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('portal_employee')
    if (!stored) { navigate('/login'); return }
    const emp = JSON.parse(stored)
    setEmployee(emp)
    fetchData(emp.id)
  }, [])

  async function fetchData(empId) {
    const [{ data: ps }, { data: rq }] = await Promise.all([
      supabase
        .from('payslips')
        .select('*, payroll_months(payroll_month)')
        .eq('employee_id', empId)
        .order('created_at', { ascending: false }),
      supabase
        .from('employee_requests')
        .select('*')
        .eq('employee_id', empId)
        .order('created_at', { ascending: false })
    ])
    if (ps) setPayslips(ps)
    if (rq) setRequests(rq)
    setLoading(false)
  }

  function handleLogout() {
    localStorage.removeItem('portal_employee')
    navigate('/login')
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">Loading...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">PeopleOne</h1>
          <p className="text-blue-300 text-xs">Employee Self-Service Portal</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium">{employee?.first_name} {employee?.last_name || ''}</p>
            <p className="text-blue-300 text-xs">{employee?.employee_code}</p>
          </div>
          <button onClick={handleLogout}
            className="bg-blue-800 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-blue-700">
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-0">
          {[
            { key: 'home',     label: '🏠 Home' },
            { key: 'payslips', label: '📄 Payslips' },
            { key: 'requests', label: '🙋 Requests' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition
                ${activeTab === tab.key
                  ? 'border-blue-900 text-blue-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {activeTab === 'home'     && <HomeTab employee={employee} payslips={payslips} />}
        {activeTab === 'payslips' && <PayslipsTab payslips={payslips} employee={employee} />}
        {activeTab === 'requests' && <RequestsTab requests={requests} employee={employee} onRefresh={() => fetchData(employee.id)} />}
      </div>
    </div>
  )
}

// ── HOME TAB ──────────────────────────────────────────────────
function HomeTab({ employee, payslips }) {
  const [empDetails, setEmpDetails] = useState(null)

  useEffect(() => {
    async function fetchDetails() {
      const { data } = await supabase
        .from('employees')
        .select('*, client_sites(site_name, state_code)')
        .eq('id', employee.id)
        .single()
      if (data) setEmpDetails(data)
    }
    fetchDetails()
  }, [employee.id])

  const lastPayslip = payslips[0]

  return (
    <div className="space-y-4">
      {/* Welcome card */}
      <div className="bg-blue-900 text-white rounded-2xl p-6">
        <p className="text-blue-300 text-sm">Welcome back,</p>
        <h2 className="text-2xl font-bold mt-1">
          {employee.first_name} {employee.last_name || ''}
        </h2>
        <p className="text-blue-300 text-sm mt-1">{employee.employee_code}</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-xs text-gray-400">Designation</p>
          <p className="font-semibold text-gray-700 mt-1">
            {empDetails?.designation || '—'}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-xs text-gray-400">Work Location</p>
          <p className="font-semibold text-gray-700 mt-1">
            {empDetails?.client_sites?.site_name || '—'}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-xs text-gray-400">Date of Joining</p>
          <p className="font-semibold text-gray-700 mt-1">
            {empDetails?.date_of_joining
              ? new Date(empDetails.date_of_joining).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
              : '—'}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-xs text-gray-400">Last Payslip</p>
          <p className="font-semibold text-gray-700 mt-1">
            {lastPayslip
              ? new Date(lastPayslip.payroll_months?.payroll_month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
              : 'Not generated'}
          </p>
        </div>
      </div>

      {/* Quick links */}
      <div className="bg-white rounded-2xl shadow p-4">
        <p className="text-sm font-semibold text-gray-600 mb-3">Quick Access</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: '📄', label: 'Payslips' },
            { icon: '🙋', label: 'Requests' },
            { icon: '📑', label: 'Form 16\n(Coming Soon)' },
          ].map(item => (
            <div key={item.label}
              className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
              <p className="text-2xl">{item.icon}</p>
              <p className="text-xs text-gray-500 mt-1 whitespace-pre-line">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── PAYSLIPS TAB ──────────────────────────────────────────────
function PayslipsTab({ payslips, employee }) {
  function downloadPayslip(ps) {
    const doc = new jsPDF()
    const pageW = doc.internal.pageSize.width

    doc.setFillColor(26, 58, 92)
    doc.rect(0, 0, pageW, 28, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18); doc.setFont('helvetica', 'bold')
    doc.text('PeopleOne', pageW / 2, 12, { align: 'center' })
    doc.setFontSize(9); doc.setFont('helvetica', 'normal')
    doc.text('Staffing & Payroll Platform', pageW / 2, 20, { align: 'center' })

    doc.setFillColor(200, 150, 12)
    doc.rect(0, 28, pageW, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11); doc.setFont('helvetica', 'bold')
    doc.text('PAYSLIP', pageW / 2, 34, { align: 'center' })

    const month = ps.payroll_months?.payroll_month
      ? new Date(ps.payroll_months.payroll_month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
      : '—'

    autoTable(doc, {
      startY: 42,
      body: [[
        { content: `Employee: ${employee.first_name} ${employee.last_name || ''}\nEmployee ID: ${employee.employee_code}`, styles: { fontStyle: 'bold' } },
        { content: `Pay Period: ${month}` }
      ]],
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 90, fillColor: [240, 245, 255] }, 1: { cellWidth: 90 } },
      margin: { left: 10, right: 10 },
    })

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 6,
      head: [['Earnings', 'Amount', 'Deductions', 'Amount']],
      body: [
        ['Basic Salary', `Rs.${Number(ps.basic || 0).toLocaleString()}`, 'PF (Employee)', `Rs.${Number(ps.pf_employee || 0).toLocaleString()}`],
        ['HRA', `Rs.${Number(ps.hra || 0).toLocaleString()}`, 'ESIC (Employee)', `Rs.${Number(ps.esic_employee || 0).toLocaleString()}`],
        ['Special Allowance', `Rs.${Number(ps.special_allowance || 0).toLocaleString()}`, 'Prof. Tax', `Rs.${Number(ps.pt_employee || 0).toLocaleString()}`],
        ['Statutory Bonus', `Rs.${Number(ps.statutory_bonus || 0).toLocaleString()}`, 'LWF', `Rs.${Number(ps.lwf_employee || 0).toLocaleString()}`],
        [{ content: `Gross: Rs.${Number(ps.gross_earnings || 0).toLocaleString()}`, styles: { fontStyle: 'bold' } }, '',
         { content: `Total Deductions: Rs.${Number(ps.total_deductions || 0).toLocaleString()}`, styles: { fontStyle: 'bold' } }, ''],
      ],
      theme: 'grid',
      headStyles: { fillColor: [26, 58, 92], textColor: 255 },
      styles: { fontSize: 8.5 },
      margin: { left: 10, right: 10 },
    })

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 4,
      body: [[
        { content: `NET PAY: Rs.${Number(ps.net_pay || 0).toLocaleString()}`, styles: { fontStyle: 'bold', fontSize: 12 } }
      ]],
      theme: 'grid',
      bodyStyles: { fillColor: [26, 58, 92], textColor: 255, halign: 'center' },
      margin: { left: 10, right: 10 },
    })

    doc.save(`Payslip_${employee.employee_code}_${month.replace(' ', '_')}.pdf`)
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-700 mb-4">My Payslips</h3>
      {payslips.length === 0 ? (
        <div className="bg-white rounded-2xl shadow p-10 text-center">
          <p className="text-4xl mb-3">📄</p>
          <p className="text-gray-400">No payslips generated yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payslips.map(ps => {
            const month = ps.payroll_months?.payroll_month
              ? new Date(ps.payroll_months.payroll_month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
              : '—'
            return (
              <div key={ps.id} className="bg-white rounded-2xl shadow p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-700">{month}</p>
                  <p className="text-sm text-gray-400 mt-0.5">
                    Net Pay: <span className="text-green-600 font-medium">
                      Rs.{Number(ps.net_pay || 0).toLocaleString()}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => downloadPayslip(ps)}
                  className="bg-blue-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-800 transition">
                  ⬇️ Download
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── REQUESTS TAB ──────────────────────────────────────────────
function RequestsTab({ requests, employee, onRefresh }) {
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ request_type: '', request_details: '' })

  const requestTypes = [
    { value: 'salary_certificate',      label: '💰 Salary Certificate' },
    { value: 'employment_certificate',  label: '🏢 Employment Certificate' },
    { value: 'experience_letter',       label: '📋 Experience Letter' },
    { value: 'noc_letter',              label: '✅ NOC Letter' },
    { value: 'address_proof',           label: '🏠 Address Proof Letter' },
    { value: 'payslip_reprint',         label: '📄 Payslip Reprint' },
    { value: 'other',                   label: '🔖 Other Request' },
  ]

  async function handleSubmit() {
    if (!form.request_type) return
    setSaving(true)

    const { data: company } = await supabase
      .from('companies').select('id').limit(1).single()

    await supabase.from('employee_requests').insert({
      company_id: company?.id,
      employee_id: employee.id,
      request_type: form.request_type,
      request_details: form.request_details || null,
      status: 'pending',
    })

    setSaving(false)
    setShowForm(false)
    setForm({ request_type: '', request_details: '' })
    onRefresh()
  }

  const statusColor = {
    pending:    'bg-yellow-100 text-yellow-700',
    processing: 'bg-blue-100 text-blue-700',
    completed:  'bg-green-100 text-green-700',
    rejected:   'bg-red-100 text-red-700',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-700">My Requests</h3>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800">
          + New Request
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl shadow p-5 mb-4">
          <h4 className="font-semibold text-gray-700 mb-4">New Request</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Request Type *</label>
              <select value={form.request_type}
                onChange={e => setForm({ ...form, request_type: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select request type</option>
                {requestTypes.map(rt => (
                  <option key={rt.value} value={rt.value}>{rt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Details (optional)</label>
              <textarea
                value={form.request_details}
                onChange={e => setForm({ ...form, request_details: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any specific details or requirements..." />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleSubmit} disabled={saving || !form.request_type}
              className="bg-blue-900 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50">
              {saving ? 'Submitting...' : '✅ Submit Request'}
            </button>
            <button onClick={() => setShowForm(false)} className="text-gray-500 text-sm">Cancel</button>
          </div>
        </div>
      )}

      {requests.length === 0 ? (
        <div className="bg-white rounded-2xl shadow p-10 text-center">
          <p className="text-4xl mb-3">🙋</p>
          <p className="text-gray-400">No requests yet.</p>
          <p className="text-gray-300 text-sm mt-1">Submit a request for any HR document.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <div key={req.id} className="bg-white rounded-2xl shadow p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-700">
                    {requestTypes.find(r => r.value === req.request_type)?.label || req.request_type}
                  </p>
                  {req.request_details && (
                    <p className="text-xs text-gray-400 mt-1">{req.request_details}</p>
                  )}
                  {req.hr_remarks && (
                    <p className="text-xs text-blue-600 mt-1">HR: {req.hr_remarks}</p>
                  )}
                  <p className="text-xs text-gray-300 mt-1">
                    {new Date(req.created_at).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor[req.status] || 'bg-gray-100 text-gray-600'}`}>
                  {req.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Dashboard