import { useState, useEffect } from 'react'
import {
  X, User, Shield, Palette, Check, Loader2,
  Eye, EyeOff, Camera, Pencil, Smile, CheckCircle2
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './ui/button'
import { Input } from './ui/input'

const AVATAR_STYLES = [
  { id: 'avataaars', label: 'Illustrated' },
  { id: 'bottts', label: 'Robots' },
  { id: 'pixel-art', label: 'Pixel' },
  { id: 'lorelei', label: 'Lorelei' },
  { id: 'micah', label: 'Micah' },
  { id: 'notionists', label: 'Notionists' },
  { id: 'open-peeps', label: 'Peeps' },
  { id: 'croodles', label: 'Croodles' },
  { id: 'fun-emoji', label: 'Emoji' },
  { id: 'identicon', label: 'Identicon' },
  { id: 'initials', label: 'Initials' },
  { id: 'rings', label: 'Rings' },
]

const STATUS_OPTIONS = [
  { id: 'online', label: 'Online', color: 'bg-green-400' },
  { id: 'busy', label: 'Busy', color: 'bg-yellow-400' },
  { id: 'dnd', label: 'Do Not Disturb', color: 'bg-red-400' },
  { id: 'away', label: 'Away', color: 'bg-gray-400' },
]

const TABS = [
  { id: 'profile', icon: User, label: 'Profile' },
  { id: 'avatar', icon: Palette, label: 'Avatar' },
  { id: 'security', icon: Shield, label: 'Security' },
]

function avatarUrl(style, seed) {
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`
}

export default function ProfileModal({ open, onClose }) {
  const { user, updateUser } = useAuth()

  const [tab, setTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [status, setStatus] = useState('online')

  const [avatarStyle, setAvatarStyle] = useState('avataaars')
  const [avatarSeed, setAvatarSeed] = useState('')
  const [previewSeed, setPreviewSeed] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)

  useEffect(() => {
    if (user && open) {
      setDisplayName(user.displayName || '')
      setBio(user.bio || '')
      setStatus(user.status || 'online')
      setAvatarStyle(user.avatarStyle || 'avataaars')
      const seed = user.avatarSeed || user.username || ''
      setAvatarSeed(seed)
      setPreviewSeed(seed)
      setError('')
      setSuccess(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
  }, [user, open])

  if (!open) return null

  const handleSaveProfile = async () => {
    setError('')
    setSaving(true)
    try {
      await updateUser({ displayName, bio, status })
      flash()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAvatar = async () => {
    setError('')
    setSaving(true)
    try {
      await updateUser({ avatarStyle, avatarSeed: previewSeed })
      setAvatarSeed(previewSeed)
      flash()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    setError('')
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return }
    if (newPassword.length < 6) { setError('New password must be at least 6 characters'); return }
    setSaving(true)
    try {
      await updateUser({ currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      flash()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const flash = () => {
    setSuccess(true)
    setTimeout(() => setSuccess(false), 2500)
  }

  const randomizeSeed = () => {
    const seed = Math.random().toString(36).substring(2, 10)
    setPreviewSeed(seed)
  }

  const livePreview = avatarUrl(avatarStyle, previewSeed || user?.username)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl glass border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={user?.avatar}
                alt={user?.displayName}
                className="w-10 h-10 rounded-full border-2 border-primary/50"
              />
              <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${
                STATUS_OPTIONS.find(s => s.id === (user?.status || 'online'))?.color || 'bg-green-400'
              }`} />
            </div>
            <div>
              <p className="font-semibold text-sm">{user?.displayName}</p>
              <p className="text-xs text-muted-foreground">@{user?.username}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex border-b border-border/50">
          {TABS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => { setTab(id); setError(''); setSuccess(false) }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium transition-all duration-200
                ${tab === id ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Saved successfully!
            </div>
          )}

          {tab === 'profile' && (
            <ProfileTab
              displayName={displayName} setDisplayName={setDisplayName}
              bio={bio} setBio={setBio}
              status={status} setStatus={setStatus}
              user={user}
            />
          )}

          {tab === 'avatar' && (
            <AvatarTab
              avatarStyle={avatarStyle} setAvatarStyle={setAvatarStyle}
              previewSeed={previewSeed} setPreviewSeed={setPreviewSeed}
              livePreview={livePreview}
              randomizeSeed={randomizeSeed}
              currentAvatarSeed={avatarSeed}
            />
          )}

          {tab === 'security' && (
            <SecurityTab
              currentPassword={currentPassword} setCurrentPassword={setCurrentPassword}
              newPassword={newPassword} setNewPassword={setNewPassword}
              confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
              showCurrent={showCurrent} setShowCurrent={setShowCurrent}
              showNew={showNew} setShowNew={setShowNew}
              user={user}
            />
          )}
        </div>

        <div className="px-6 py-4 border-t border-border/50 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} className="text-sm">Cancel</Button>
          <Button
            variant="gradient"
            onClick={tab === 'profile' ? handleSaveProfile : tab === 'avatar' ? handleSaveAvatar : handleChangePassword}
            disabled={saving}
            className="text-sm min-w-[110px]"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                {tab === 'security' ? 'Change Password' : 'Save Changes'}
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

function ProfileTab({ displayName, setDisplayName, bio, setBio, status, setStatus, user }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 border border-border/50">
        <img src={user?.avatar} alt={user?.displayName} className="w-14 h-14 rounded-full border-2 border-border" />
        <div>
          <p className="font-semibold">{user?.displayName}</p>
          <p className="text-xs text-muted-foreground">@{user?.username} · {user?.email}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Member since {new Date(user?.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-muted-foreground" /> Display Name
        </label>
        <Input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your display name"
          maxLength={40}
        />
        <p className="text-xs text-muted-foreground text-right">{displayName.length}/40</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-1.5">
          <Pencil className="w-3.5 h-3.5 text-muted-foreground" /> Bio
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell people a bit about yourself..."
          maxLength={200}
          rows={3}
          className="w-full rounded-lg border border-input bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none transition-all"
        />
        <p className="text-xs text-muted-foreground text-right">{bio.length}/200</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-1.5">
          <Smile className="w-3.5 h-3.5 text-muted-foreground" /> Status
        </label>
        <div className="grid grid-cols-2 gap-2">
          {STATUS_OPTIONS.map(({ id, label, color }) => (
            <button
              key={id}
              onClick={() => setStatus(id)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-150
                ${status === id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border/50 bg-secondary/30 text-muted-foreground hover:border-border hover:text-foreground'
                }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
              {label}
              {status === id && <Check className="w-3.5 h-3.5 ml-auto" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function AvatarTab({ avatarStyle, setAvatarStyle, previewSeed, setPreviewSeed, livePreview, randomizeSeed }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-3 p-5 rounded-xl bg-secondary/30 border border-border/50">
        <div className="relative">
          <img
            src={livePreview}
            alt="Avatar preview"
            className="w-24 h-24 rounded-full border-4 border-primary/40 bg-gray-800 shadow-lg shadow-primary/10"
          />
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-md">
            <Camera className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Live preview</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Avatar Style</label>
        <div className="grid grid-cols-3 gap-2">
          {AVATAR_STYLES.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setAvatarStyle(id)}
              className={`flex flex-col items-center gap-2 p-2.5 rounded-xl border transition-all duration-150 hover:-translate-y-0.5
                ${avatarStyle === id
                  ? 'border-primary bg-primary/10'
                  : 'border-border/50 bg-secondary/30 hover:border-border'
                }`}
            >
              <img
                src={`https://api.dicebear.com/7.x/${id}/svg?seed=${previewSeed || 'nexus'}`}
                alt={label}
                className="w-10 h-10 rounded-full bg-gray-800"
              />
              <span className={`text-xs font-medium ${avatarStyle === id ? 'text-primary' : 'text-muted-foreground'}`}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Avatar Seed</label>
        <p className="text-xs text-muted-foreground">The seed determines the unique look within each style</p>
        <div className="flex gap-2">
          <Input
            value={previewSeed}
            onChange={(e) => setPreviewSeed(e.target.value)}
            placeholder="Enter any text as seed..."
            className="flex-1"
          />
          <Button variant="outline" onClick={randomizeSeed} className="shrink-0 text-xs px-3">
            Randomize
          </Button>
        </div>
      </div>
    </div>
  )
}

function SecurityTab({ currentPassword, setCurrentPassword, newPassword, setNewPassword, confirmPassword, setConfirmPassword, showCurrent, setShowCurrent, showNew, setShowNew, user }) {
  const strength = getPasswordStrength(newPassword)

  return (
    <div className="space-y-5">
      <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 space-y-1">
        <p className="text-sm font-medium">Account Security</p>
        <p className="text-xs text-muted-foreground">@{user?.username} · {user?.email}</p>
        <div className="flex items-center gap-1.5 mt-2">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs text-emerald-400">Password encrypted with bcrypt (12 rounds)</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Current Password</label>
        <div className="relative">
          <Input
            type={showCurrent ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowCurrent(!showCurrent)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">New Password</label>
        <div className="relative">
          <Input
            type={showNew ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min. 6 characters"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowNew(!showNew)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {newPassword && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    i <= strength.score
                      ? strength.score <= 1 ? 'bg-red-400'
                        : strength.score <= 2 ? 'bg-yellow-400'
                        : strength.score <= 3 ? 'bg-blue-400'
                        : 'bg-green-400'
                      : 'bg-secondary'
                  }`}
                />
              ))}
            </div>
            <p className={`text-xs ${
              strength.score <= 1 ? 'text-red-400'
              : strength.score <= 2 ? 'text-yellow-400'
              : strength.score <= 3 ? 'text-blue-400'
              : 'text-green-400'
            }`}>
              {strength.label}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Confirm New Password</label>
        <Input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repeat new password"
          className={confirmPassword && confirmPassword !== newPassword ? 'border-red-500/50 focus:ring-red-500/50' : ''}
        />
        {confirmPassword && confirmPassword !== newPassword && (
          <p className="text-xs text-red-400">Passwords do not match</p>
        )}
      </div>
    </div>
  )
}

function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: '' }
  let score = 0
  if (pw.length >= 6) score++
  if (pw.length >= 10) score++
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  return { score, label: labels[score] || 'Weak' }
}
