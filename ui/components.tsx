import { type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react"

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,.04),0_6px_16px_rgba(0,0,0,.04)] ${className}`}>{children}</div>
}

export function CardHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`flex flex-col gap-1 px-6 pt-5 pb-3 ${className}`}>{children}</div>
}

export function CardContent({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`px-6 pb-6 ${className}`}>{children}</div>
}

export function Label({ children, htmlFor, className = "" }: { children: ReactNode; htmlFor?: string; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={`text-sm font-semibold text-slate-900 ${className}`}>
      {children}
    </label>
  )
}

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
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
    default:   "bg-slate-900 text-white hover:bg-slate-800 shadow-sm",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    ghost:     "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  }
  return (
    <button
      {...props}
      className={`inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-5 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${className}`}
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

export function StatCard({ label, value, mono = false, icon }: {
  label: string; value: string | number; mono?: boolean; icon?: React.JSX.Element
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,.04),0_6px_16px_rgba(0,0,0,.04)] hover:shadow-[0_2px_6px_rgba(0,0,0,.06),0_8px_24px_rgba(0,0,0,.06)] transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
          <p className={`text-2xl font-bold text-slate-900 mt-2 tabular-nums ${mono ? "font-mono" : ""}`}>
            {value}
          </p>
        </div>
        {icon && (
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-sm">
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
          checked ? "bg-slate-900" : "bg-slate-200"
        }`}
      >
        <span className={`pointer-events-none inline-block size-4 rounded-full bg-white shadow-sm ring-0 transition-transform ${
          checked ? "translate-x-4" : "translate-x-0"
        }`} />
      </button>
      {label && <span className="text-sm text-slate-600">{label}</span>}
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
      className={`h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition-all focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
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
        className="size-4 rounded border-slate-300 text-slate-900 focus:ring-slate-300"
      />
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  )
}
