import { useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { updateMe } from '../api/auth.js'
import Layout from '../components/Layout.jsx'

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300'
const btnPrimary = 'px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50'

export default function Profile() {
  const { user, setUser } = useAuth()

  const [infoForm, setInfoForm] = useState({ name: user?.name ?? '', email: user?.email ?? '' })
  const [infoSaving, setInfoSaving] = useState(false)
  const [infoSuccess, setInfoSuccess] = useState(false)
  const [infoError, setInfoError] = useState(null)

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError] = useState(null)

  function setInfo(field, value) {
    setInfoForm((prev) => ({ ...prev, [field]: value }))
  }

  function setPw(field, value) {
    setPwForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleInfoSubmit(e) {
    e.preventDefault()
    setInfoSaving(true)
    setInfoError(null)
    setInfoSuccess(false)
    try {
      const updated = await updateMe({ name: infoForm.name, email: infoForm.email })
      setUser(updated)
      setInfoSuccess(true)
    } catch (err) {
      setInfoError(err.response?.data?.error ?? err.message)
    } finally {
      setInfoSaving(false)
    }
  }

  async function handlePwSubmit(e) {
    e.preventDefault()
    setPwError(null)
    setPwSuccess(false)

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('New passwords do not match.')
      return
    }

    setPwSaving(true)
    try {
      await updateMe({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPwSuccess(true)
    } catch (err) {
      setPwError(err.response?.data?.error ?? err.message)
    } finally {
      setPwSaving(false)
    }
  }

  return (
    <Layout>
      <div className="px-8 py-8 max-w-xl">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-500 mt-0.5">View and update your account information.</p>
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Account Info</h2>

          <div className="mb-4 text-sm text-gray-500">
            <span className="font-medium text-gray-700">Role:</span>{' '}
            <span className="capitalize">{user?.role}</span>
          </div>

          <form onSubmit={handleInfoSubmit} className="space-y-4">
            {infoError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{infoError}</p>}
            {infoSuccess && <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">Profile updated successfully.</p>}

            <Field label="Full Name">
              <input
                className={inputCls}
                value={infoForm.name}
                onChange={(e) => setInfo('name', e.target.value)}
                required
              />
            </Field>

            <Field label="Email">
              <input
                className={inputCls}
                type="email"
                value={infoForm.email}
                onChange={(e) => setInfo('email', e.target.value)}
                required
              />
            </Field>

            <button type="submit" disabled={infoSaving} className={btnPrimary}>
              {infoSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Password Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Change Password</h2>

          <form onSubmit={handlePwSubmit} className="space-y-4">
            {pwError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{pwError}</p>}
            {pwSuccess && <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">Password changed successfully.</p>}

            <Field label="Current Password">
              <input
                className={inputCls}
                type="password"
                value={pwForm.currentPassword}
                onChange={(e) => setPw('currentPassword', e.target.value)}
                required
              />
            </Field>

            <Field label="New Password">
              <input
                className={inputCls}
                type="password"
                value={pwForm.newPassword}
                onChange={(e) => setPw('newPassword', e.target.value)}
                required
                minLength={8}
                placeholder="Min. 8 characters"
              />
            </Field>

            <Field label="Confirm New Password">
              <input
                className={inputCls}
                type="password"
                value={pwForm.confirmPassword}
                onChange={(e) => setPw('confirmPassword', e.target.value)}
                required
                minLength={8}
              />
            </Field>

            <button type="submit" disabled={pwSaving} className={btnPrimary}>
              {pwSaving ? 'Changing…' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  )
}
