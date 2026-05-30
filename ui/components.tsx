import { type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react"

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[0_1px_3px_rgba(0,0,0,.04),0_6px_16px_rgba(0,0,0,.04)] transition-shadow hover:shadow-[0_2px_6px_rgba(0,0,0,.06),0_8px_24px_rgba(0,0,0,.06)] ${className}`}>{children}</div>
}

export function CardHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`flex flex-col gap-1 px-6 pt-5 pb-3 ${className}`}>{children}</div>
}

export function CardContent({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`px-6 pb-6 ${className}`}>{children}</div>
}

export function Label({ children, htmlFor, className = "" }: { children: ReactNode; htmlFor?: string; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={`text-sm font-semibold text-[var(--foreground)] ${className}`}>
      {children}
    </label>
  )
}

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-10 w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-sm outline-none transition-all placeholder:text-[var(--muted-foreground)] focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    />
  )
}

type ButtonVariant = "default" | "secondary" | "ghost"
export function Button({
  variant = "default",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  const variants: Record<ButtonVariant, string> = {
    default:   "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 shadow-sm",
    secondary: "bg-[var(--accent)] text-[var(--accent-foreground)] hover:opacity-80",
    ghost:     "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]",
  }
  return (
    <button
      {...props}
      className={`inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-5 text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] ${variants[variant]} ${className}`}
    />
  )
}

export function Badge({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${className}`}>
      {children}
    </span>
  )
}

export function StatCard({ label, value, mono = false, icon, accent }: {
  label: string; value: string | number; mono?: boolean; icon?: React.JSX.Element; accent?: boolean
}) {
  return (
    <div className={`rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_1px_3px_rgba(0,0,0,.04),0_6px_16px_rgba(0,0,0,.04)] hover:shadow-[0_2px_6px_rgba(0,0,0,.06),0_8px_24px_rgba(0,0,0,.06)] transition-all group ${accent ? "border-l-[3px] border-l-[var(--poke-warm)]" : ""}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">{label}</p>
          <p className={`text-2xl font-bold text-[var(--foreground)] mt-2 tabular-nums ${mono ? "font-mono" : ""}`}>
            {value}
          </p>
        </div>
        {icon && (
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent-foreground)] text-[var(--primary-foreground)] shadow-sm opacity-80 group-hover:opacity-100 transition-opacity">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

export function Toggle({ checked, onChange, label }: {
  checked: boolean; onChange: (v: boolean) => void; label?: string
}) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${
          checked ? "bg-[var(--poke-warm)]" : "bg-[var(--muted)]"
        }`}
      >
        <span className={`pointer-events-none inline-block size-4 rounded-full bg-white shadow-sm ring-0 transition-transform ${
          checked ? "translate-x-4" : "translate-x-0"
        }`} />
      </button>
      {label && <span className="text-sm text-[var(--muted-foreground)]">{label}</span>}
    </label>
  )
}

interface SelectOption { value: string; label: string }
export function Select({ value, onChange, options, className = "" }: {
  value: string; onChange: (v: string) => void; options: SelectOption[]; className?: string
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`h-10 w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-sm outline-none transition-all focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

export function Checkbox({ checked, onChange, label }: {
  checked: boolean; onChange: (v: boolean) => void; label: string
}) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 rounded border-[var(--border)] text-[var(--poke-warm)] focus:ring-[var(--ring)]"
      />
      <span className="text-sm text-[var(--foreground)]">{label}</span>
    </label>
  )
}
