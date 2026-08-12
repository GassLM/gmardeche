import { useState } from 'react'
import { signIn } from '../lib/api.js'
import { Button, Card } from '../lib/ui.jsx'
import { Field, Input } from './fields.jsx'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setError('')
    const { error } = await signIn(email.trim(), password)
    setBusy(false)
    if (error) setError('Identifiants invalides.')
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm p-6">
        <div className="mb-6 text-center">
          <div className="font-display text-3xl uppercase text-shimmer">Espace admin</div>
          <div className="mt-1 font-mono text-xs uppercase tracking-widest text-cream/50">La Cuvee des FDP</div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                   autoComplete="email" required />
          </Field>
          <Field label="Mot de passe">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                   autoComplete="current-password" required />
          </Field>
          {error && <p className="text-sm text-coral">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Connexion...' : 'Se connecter'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
