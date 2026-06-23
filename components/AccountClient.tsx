'use client'

import { useRef, useState } from 'react'
import Icon, { type IconName } from './Icon'

interface AccountClientProps {
  name: string
  email: string
  role: string
  productsCount: number
  salesCount: number
  lowStockCount: number
  memberSince: string
}

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner',
  MANAGER: 'Store Manager',
  STAFF: 'Staff',
}

export default function AccountClient({
  name,
  email,
  role,
  productsCount,
  salesCount,
  lowStockCount,
  memberSince,
}: AccountClientProps) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const fileRef = useRef<HTMLInputElement>(null)
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const [form, setForm] = useState({
    fullName: name,
    jobTitle: ROLE_LABELS[role] ?? 'Store Manager',
    email: email,
    phone: '+92 300 1234567',
    storeName: 'StockPilot HQ',
    location: 'Karachi, Pakistan',
    bio: 'Electronics inventory specialist with a focus on supply chain efficiency and data-driven stock management.',
  })

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setAvatarSrc(url)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      {/* ── Left column ── */}
      <div className="flex flex-col gap-5">
        {/* Avatar card */}
        <div className="rounded-3xl bg-card p-6 shadow-card text-center">
          <div className="relative mx-auto mb-4 w-fit">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt="Profile"
                className="h-24 w-24 rounded-full object-cover ring-4 ring-canvas"
              />
            ) : (
              <div className="grid h-24 w-24 place-items-center rounded-full bg-ink text-2xl font-bold text-lime ring-4 ring-canvas select-none">
                {initials}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-lime-deep text-ink shadow-md hover:scale-105 transition-transform"
              aria-label="Change profile picture"
            >
              <Icon name="camera" size={14} />
            </button>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />

          <p className="font-display text-lg font-bold leading-tight">{form.fullName}</p>
          <p className="mt-0.5 text-sm text-muted">{form.jobTitle}</p>
          <p className="mt-1 text-xs text-muted">{form.storeName} · {form.location}</p>

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mt-4 w-full rounded-2xl border border-line py-2 text-xs font-semibold text-ink hover:bg-canvas transition-colors"
          >
            Upload Photo
          </button>
          <p className="mt-2 text-[11px] text-muted">JPG, PNG or WEBP · Max 5 MB</p>
        </div>

        {/* Profile info card */}
        <div className="rounded-3xl bg-card p-5 shadow-card space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Contact</h3>
          <InfoRow icon="mail" value={form.email} />
          <InfoRow icon="phone" value={form.phone} />
          <div className="border-t border-line pt-3 mt-1">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Details</h3>
            <InfoRow label="Role"     value={ROLE_LABELS[role] ?? role} />
            <InfoRow label="Store"    value={form.storeName} />
            <InfoRow label="Location" value={form.location} />
            <InfoRow label="Member since" value={memberSince} />
          </div>
        </div>

        {/* Activity summary */}
        <div className="rounded-3xl bg-card p-5 shadow-card">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted">Activity</h3>
          <div className="grid grid-cols-2 gap-3">
            <ActivityStat label="Products" value={productsCount} />
            <ActivityStat label="Sales" value={salesCount} />
            <ActivityStat label="Low-stock alerts" value={lowStockCount} />
            <ActivityStat label="Member since" value={memberSince} small />
          </div>
        </div>
      </div>

      {/* ── Right column: edit form ── */}
      <div className="rounded-3xl bg-card p-6 shadow-card">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-base font-bold tracking-tight">Edit Profile</h2>
          {saved && (
            <span className="rounded-full bg-lime/30 px-3 py-1 text-xs font-semibold text-ink">
              Saved!
            </span>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Full Name"  name="fullName"  value={form.fullName}  onChange={handleChange} />
            <FormField label="Job Title"  name="jobTitle"  value={form.jobTitle}  onChange={handleChange} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Email"  name="email"  type="email"  value={form.email}  onChange={handleChange} />
            <FormField label="Phone"  name="phone"  type="tel"    value={form.phone}  onChange={handleChange} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Store Name" name="storeName" value={form.storeName} onChange={handleChange} />
            <FormField label="Location"   name="location"  value={form.location}  onChange={handleChange} />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted">Bio</label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={3}
              className="w-full resize-none rounded-2xl border border-line bg-canvas px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-ink/30 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="rounded-2xl bg-ink px-6 py-2.5 text-sm font-semibold text-lime hover:opacity-90 transition-opacity"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon?: string; label?: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 py-0.5">
      {icon && <Icon name={icon as IconName} size={14} className="shrink-0 text-muted" />}
      {label && <span className="text-xs text-muted w-20 shrink-0">{label}</span>}
      <span className="text-sm truncate">{value}</span>
    </div>
  )
}

function ActivityStat({ label, value, small }: { label: string; value: number | string; small?: boolean }) {
  return (
    <div className="rounded-2xl bg-canvas p-3">
      <p className={`font-bold leading-none ${small ? 'text-sm' : 'font-display text-xl'}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p className="mt-1 text-[11px] text-muted leading-tight">{label}</p>
    </div>
  )
}

function FormField({
  label,
  name,
  value,
  type = 'text',
  onChange,
}: {
  label: string
  name: string
  value: string
  type?: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-muted">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-2xl border border-line bg-canvas px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-ink/30 focus:outline-none transition-colors"
      />
    </div>
  )
}
