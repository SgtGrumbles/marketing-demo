import { useEffect, useEffectEvent, useState } from 'react'
import { Check, CircleCheck, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { formatCount } from '@/lib/format'
import { sourceAccounts, type SourceDefinition, type SourceVolume } from '@/lib/sources'

type Step = 'account' | 'permissions' | 'importing' | 'done'

/** How long the simulated history import takes. */
const IMPORT_MS = 3_600

interface ConnectFlowProps {
  source: SourceDefinition
  volume: SourceVolume
  onConnected: () => void
  onClose: () => void
}

/** A simulated OAuth-style connection: account, consent, import progress, done. Nothing leaves the browser. */
export function ConnectFlow({ source, volume, onConnected, onClose }: ConnectFlowProps) {
  const accounts = sourceAccounts(source)
  const [step, setStep] = useState<Step>('account')
  const [account, setAccount] = useState(accounts[0]?.id ?? '')
  const [progress, setProgress] = useState(0)
  const months = Math.round(volume.days / 30.4)
  // An effect event, so a parent re-render mid-import doesn't restart the progress bar.
  const finish = useEffectEvent(() => {
    setStep('done')
    onConnected()
  })

  useEffect(() => {
    if (step !== 'importing') return
    const start = performance.now()
    let frame = requestAnimationFrame(function tick(now) {
      const t = Math.min(1, (now - start) / IMPORT_MS)
      setProgress(t)
      if (t < 1) frame = requestAnimationFrame(tick)
      else finish()
    })
    return () => cancelAnimationFrame(frame)
  }, [step])

  if (step === 'account') {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Connect {source.name}</DialogTitle>
          <DialogDescription>Choose the account Pulse should read from. Sign-in is simulated for this demo.</DialogDescription>
        </DialogHeader>
        <RadioGroup value={account} onValueChange={setAccount} className="gap-2">
          {accounts.map((option) => (
            <Label key={option.id} htmlFor={`account-${option.id}`} className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 font-normal has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
              <RadioGroupItem id={`account-${option.id}`} value={option.id} />
              <span className="grid gap-0.5">
                <span className="font-medium">{option.name}</span>
                <span className="text-xs text-muted-foreground tabular-nums">{option.detail}</span>
              </span>
            </Label>
          ))}
        </RadioGroup>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => setStep('permissions')}>Continue</Button>
        </DialogFooter>
      </>
    )
  }

  if (step === 'permissions') {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Allow Pulse to access {source.name}?</DialogTitle>
          <DialogDescription>{accounts.find((option) => option.id === account)?.name} will share:</DialogDescription>
        </DialogHeader>
        <ul className="grid gap-2 text-sm" data-testid="permissions">
          {source.permissions.map((permission) => (
            <li key={permission} className="flex items-center gap-2">
              <Check className="size-4 text-success" aria-hidden />
              {permission}
            </li>
          ))}
        </ul>
        <p className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
          <ShieldCheck className="size-4 shrink-0" aria-hidden />
          Read-only. Pulse never changes your campaigns or settings.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setStep('account')}>Back</Button>
          <Button onClick={() => setStep('importing')}>Allow access</Button>
        </DialogFooter>
      </>
    )
  }

  if (step === 'importing') {
    const label = progress < 0.12 ? 'Authorizing…' : progress < 0.9 ? `Fetching ${months} months of history…` : 'Building daily tables…'
    return (
      <>
        <DialogHeader>
          <DialogTitle>Connecting {source.name}</DialogTitle>
          <DialogDescription aria-live="polite">{label}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Progress value={progress * 100} aria-label="Import progress" className="[&_[data-slot=progress-indicator]]:transition-none" />
          <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
            <span>{formatCount(Math.round(volume.rows * progress))} of {formatCount(volume.rows)} rows</span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </DialogFooter>
      </>
    )
  }

  return (
    <>
      <DialogHeader className="items-center text-center">
        <CircleCheck className="size-10 text-success" aria-hidden />
        <DialogTitle>{source.name} connected</DialogTitle>
        <DialogDescription>
          Imported {formatCount(volume.rows)} rows covering {months} months. It will sync automatically from now on.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button onClick={onClose} className="w-full sm:w-auto">Done</Button>
      </DialogFooter>
    </>
  )
}
