import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { FormButton, FormInput } from '~/components/form'
import { Avatar, Badge, Skeleton } from '~/components/ui'
import { emptyToNull, handleMutationError, zodFieldErrors } from '~/lib/form'
import { type FieldErrors } from '~/lib/http'
import { card, cn } from '~/lib/styles'
import { useAdminMe } from '../_hooks'
import { type AdminMe } from '../_types'
import { useUpdateProfile } from './_hooks'
import { ProfileFormSchema } from './_types'

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

function ProfileForm({ me }: { me: AdminMe }) {
  const [fullName, setFullName] = useState(me.fullName ?? '')
  const [email, setEmail] = useState(me.email)
  const [currentPassword, setCurrentPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const updateProfile = useUpdateProfile()

  const emailChanged = email.trim().toLowerCase() !== me.email.toLowerCase()
  const dirty = emailChanged || emptyToNull(fullName.trim()) !== me.fullName

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = ProfileFormSchema.safeParse({
      fullName: emptyToNull(fullName.trim()),
      email: email.trim(),
      currentPassword: emailChanged ? currentPassword : undefined,
    })
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error))

    setErrors({})
    updateProfile.mutate(parsed.data, {
      onSuccess: (saved) => {
        toast.success('Profile saved')
        setFullName(saved.fullName ?? '')
        setEmail(saved.email)
        setCurrentPassword('')
      },
      onError: (error) => handleMutationError(error, setErrors),
    })
  }

  return (
    <form className="flex max-w-[480px] flex-col gap-4" onSubmit={onSubmit} noValidate>
      <FormInput
        name="fullName"
        label="Full name"
        autoComplete="name"
        value={fullName}
        onChange={(event) => setFullName(event.target.value)}
        error={errors.fullName}
      />
      <FormInput
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={errors.email}
      />
      {emailChanged && (
        <div className="flex flex-col gap-1.5">
          <FormInput
            name="currentPassword"
            type="password"
            label="Current password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            error={errors.currentPassword}
          />
          <p className="text-[12.5px] text-pretty text-muted">
            You sign in with your email, so confirm it’s you to change it.
          </p>
        </div>
      )}
      <div>
        <FormButton loading={updateProfile.isPending} disabled={!dirty}>
          Save profile
        </FormButton>
      </div>
    </form>
  )
}

export default function ProfileCard() {
  const { data: me, isLoading, isError } = useAdminMe()

  return (
    <section id="profile" className={cn(card.base, 'scroll-mt-20')}>
      <header className={card.head}>
        <div className="flex min-w-0 items-center gap-3">
          {me ? (
            <Avatar initials={me.initials} seed={me.id} />
          ) : (
            <Skeleton className="size-9 rounded-full" />
          )}
          <div className="min-w-0">
            <span className={card.eyebrow}>Profile</span>
            <h2 className={`${card.title} truncate`}>
              {me ? (me.fullName ?? me.email) : 'Your profile'}
            </h2>
          </div>
        </div>
        {me?.role && <Badge tone={me.role.isLocked ? 'primary' : 'neutral'}>{me.role.name}</Badge>}
      </header>

      {isLoading && (
        <div className="flex max-w-[480px] flex-col gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}
      {isError && (
        <p className="text-[13.5px] text-danger">
          We couldn’t load your profile. Refresh to try again.
        </p>
      )}
      {me && (
        <div className="flex flex-col gap-5">
          <dl className="grid grid-cols-1 gap-3 text-[13.5px] sm:grid-cols-2">
            <div className="min-w-0">
              <dt className="text-muted">Role</dt>
              <dd className="truncate text-ink">{me.role?.name ?? 'No role'}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-muted">Member since</dt>
              <dd className="text-ink">{dateFormat.format(new Date(me.createdAt))}</dd>
            </div>
          </dl>
          <ProfileForm key={me.updatedAt ?? me.id} me={me} />
        </div>
      )}
    </section>
  )
}
