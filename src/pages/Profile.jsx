import { useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { updateMe } from '../api/auth.js'
import Layout from '../components/Layout.jsx'

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: 'hsl(224, 20%, 55%)' }}>{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 transition-colors'
const btnPrimary = 'px-4 py-2 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50'

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
          <h1 className="text-xl font-bold" style={{ color: 'hsl(224, 40%, 95%)' }}>My Profile</h1>
          <p className="text-sm mt-0.5" style={{ color: 'hsl(224, 20%, 55%)' }}>View and update your account information.</p>
        </div>

        {/* Info Card */}
        <div className="rounded-xl p-6 mb-6" style={{ backgroundColor: 'hsl(224, 30%, 14%)', border: '1px solid hsl(224, 30%, 18%)' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'hsl(224, 30%, 85%)' }}>Account Info</h2>

          <div className="mb-4 text-sm">
            <span className="font-medium" style={{ color: 'hsl(224, 30%, 85%)' }}>Role:</span>{' '}
            <span className="capitalize" style={{ color: 'hsl(224, 20%, 55%)' }}>{user?.role}</span>
          </div>

          <form onSubmit={handleInfoSubmit} className="space-y-4">
            {infoError && <p className="text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: 'hsl(0, 100%, 10%)', color: 'hsl(0, 100%, 60%)' }}>{infoError}</p>}
            {infoSuccess && <p className="text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: 'hsl(120, 100%, 10%)', color: 'hsl(120, 100%, 50%)' }}>Profile updated successfully.</p>}

            <Field label="Full Name">
              <input
                className={inputCls}
                style={{
                  backgroundColor: 'hsl(224, 25%, 16%)',
                  border: '1px solid hsl(224, 30%, 18%)',
                  color: 'hsl(224, 40%, 95%)',
                  focusRingColor: 'hsl(244, 100%, 69%)',
                }}
                value={infoForm.name}
                onChange={(e) => setInfo('name', e.target.value)}
                required
              />
            </Field>

            <Field label="Email">
              <input
                className={inputCls}
                type="email"
                style={{
                  backgroundColor: 'hsl(224, 25%, 16%)',
                  border: '1px solid hsl(224, 30%, 18%)',
                  color: 'hsl(224, 40%, 95%)',
                }}
                value={infoForm.email}
                onChange={(e) => setInfo('email', e.target.value)}
                required
              />
            </Field>

            <button type="submit" disabled={infoSaving} className={btnPrimary} style={{ backgroundColor: 'hsl(244, 100%, 69%)', color: 'white' }}>
              {infoSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Password Card */}
        <div className="rounded-xl p-6" style={{ backgroundColor: 'hsl(224, 30%, 14%)', border: '1px solid hsl(224, 30%, 18%)' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'hsl(224, 30%, 85%)' }}>Change Password</h2>

          <form onSubmit={handlePwSubmit} className="space-y-4">
            {pwError && <p className="text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: 'hsl(0, 100%, 10%)', color: 'hsl(0, 100%, 60%)' }}>{pwError}</p>}
            {pwSuccess && <p className="text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: 'hsl(120, 100%, 10%)', color: 'hsl(120, 100%, 50%)' }}>Password changed successfully.</p>}

            <Field label="Current Password">
              <input
                className={inputCls}
                type="password"
                style={{
                  backgroundColor: 'hsl(224, 25%, 16%)',
                  border: '1px solid hsl(224, 30%, 18%)',
                  color: 'hsl(224, 40%, 95%)',
                }}
                value={pwForm.currentPassword}
                onChange={(e) => setPw('currentPassword', e.target.value)}
                required
              />
            </Field>

            <Field label="New Password">
              <input
                className={inputCls}
                type="password"
                style={{
                  backgroundColor: 'hsl(224, 25%, 16%)',
                  border: '1px solid hsl(224, 30%, 18%)',
                  color: 'hsl(224, 40%, 95%)',
                }}
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
                style={{
                  backgroundColor: 'hsl(224, 25%, 16%)',
                  border: '1px solid hsl(224, 30%, 18%)',
                  color: 'hsl(224, 40%, 95%)',
                }}
                value={pwForm.confirmPassword}
                onChange={(e) => setPw('confirmPassword', e.target.value)}
                required
                minLength={8}
              />
            </Field>

            <button type="submit" disabled={pwSaving} className={btnPrimary} style={{ backgroundColor: 'hsl(244, 100%, 69%)', color: 'white' }}>
              {pwSaving ? 'Changing…' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  )
}
