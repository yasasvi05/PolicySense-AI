import { useEffect, useState } from 'react'
import { Lock, Pencil } from 'lucide-react'
import { api } from '../../services'
import { useToast } from '../../context/ToastContext'
import { useAsync } from '../../hooks/useAsync'
import { CardSkeleton, ErrorState, KeyValue, PageHeader, Spinner, StatusBadge } from '../../components/ui'
import { fmtDateLong } from '../../utils'

const EDITABLE = [['phone', 'Phone', /^[+0-9 \-]{8,20}$/, 'Enter a valid phone number'], ['address', 'Address', /^.{3,255}$/, 'Address is too short'], ['city', 'City', /^.{2,80}$/, 'Enter a city'], ['state', 'State', /^.{2,80}$/, 'Enter a state'], ['pincode', 'Pincode', /^[0-9]{6}$/, 'Pincode must be 6 digits']]

export default function Profile() {
  const toast = useToast()
  const { data, loading, error, reload } = useAsync(() => api.getProfile())
  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  useEffect(() => { if (data) setProfile(data) }, [data])

  if (error) return <ErrorState message={error} onRetry={reload} />
  if (loading || !profile) return <><PageHeader title="Profile" /><CardSkeleton rows={6} /></>

  const start = () => { setForm(Object.fromEntries(EDITABLE.map(([k]) => [k, profile[k]]))); setErrors({}); setEditing(true) }
  const save = async (e) => {
    e.preventDefault()
    const errs = Object.fromEntries(EDITABLE.filter(([k, , re]) => !re.test(form[k] || '')).map(([k, , , msg]) => [k, msg]))
    setErrors(errs)
    if (Object.keys(errs).length) return
    setSaving(true)
    try { setProfile(await api.updateProfile(form)); setEditing(false); toast('Profile updated') } catch (err) { toast(err.message, 'error') } finally { setSaving(false) }
  }

  return (
    <div>
      <PageHeader title="Profile" subtitle="Your contact details and verification status." actions={!editing && <button className="btn-outline" onClick={start}><Pencil className="h-4 w-4" />Edit details</button>} />
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <section className="card p-5">
          <div className="mb-5 flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand text-xl font-bold text-white">{profile.full_name.split(' ').map((w) => w[0]).slice(0, 2).join('')}</span>
            <div><p className="text-lg font-semibold">{profile.full_name}</p><p className="text-sm text-navy-500">{profile.customer_id}</p></div>
          </div>
          <KeyValue items={[['Email', profile.email], ['KYC Status', <StatusBadge status={profile.kyc_status} />], ['Customer Since', fmtDateLong(profile.customer_since)], ['Date of birth', fmtDateLong(profile.date_of_birth)]]} />
          <p className="mt-5 flex items-start gap-2 rounded-lg bg-navy-50 p-3 text-xs text-navy-500"><Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />Name, email, date of birth and KYC details can only be changed through verified support requests.</p>
        </section>
        <section className="card p-5">
          <h2 className="mb-4 font-semibold">Contact details</h2>
          {editing ? (
            <form onSubmit={save} className="space-y-4" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                {EDITABLE.map(([k, label]) => (
                  <div key={k} className={k === 'address' ? 'sm:col-span-2' : ''}>
                    <label className="label" htmlFor={k}>{label}</label>
                    <input id={k} className="input" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} aria-invalid={!!errors[k]} />
                    {errors[k] && <p className="mt-1 text-xs text-red-600">{errors[k]}</p>}
                  </div>))}
              </div>
              <div className="flex gap-2"><button className="btn-primary" disabled={saving}>{saving && <Spinner />}Save changes</button><button type="button" className="btn-ghost" onClick={() => setEditing(false)}>Cancel</button></div>
            </form>
          ) : <KeyValue items={[['Phone', profile.phone], ['Address', profile.address], ['City', profile.city], ['State', profile.state], ['Pincode', profile.pincode]]} />}
        </section>
      </div>
    </div>
  )
}
