import { useState, useEffect, useCallback } from "react"
import { Card, CardHeader, CardContent, Label, Badge, StatCard } from "../components"
import { API, apiFetch } from "../api"

interface PokeLogEntry {
  time: number
  pokerId: string
  targetId: string
  groupId?: string
  isSelfPoke: boolean
  ruleName: string
  action: string
}

interface Status {
  startTime: number
  totalCount: number
  todayCount: number
  recentLogs: PokeLogEntry[]
  rulesCount: number
  enabledRulesCount: number
}

function fmtTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

function fmtDateTime(ts: number): string {
  return new Date(ts).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

function fmtUptime(ms: number): string {
  const s = Math.floor(ms / 1000)
  const h = String(Math.floor(s / 3600)).padStart(2, "0")
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0")
  const sec = String(s % 60).padStart(2, "0")
  return `${h}:${m}:${sec}`
}

const ACTION_LABELS: Record<string, string> = {
  poke_back: "戳回去",
  follow_poker: "跟戳戳人者",
  follow_targeted: "跟戳被戳者",
  message: "回复消息",
}

const ACTION_BADGE: Record<string, string> = {
  poke_back: "border-rose-200 bg-rose-50 text-rose-700",
  follow_poker: "border-amber-200 bg-amber-50 text-amber-700",
  follow_targeted: "border-amber-200 bg-amber-50 text-amber-700",
  message: "border-emerald-200 bg-emerald-50 text-emerald-700",
}

export default function Dashboard() {
  const [status, setStatus] = useState<Status | null>(null)
  const [uptime, setUptime] = useState("—")

  const load = useCallback(async () => {
    try {
      const r = await apiFetch(`${API}/status`).then((r) => r.json()) as Status
      setStatus(r)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!status?.startTime) return
    const start = status.startTime
    setUptime(fmtUptime(Date.now() - start))
    const t = setInterval(() => setUptime(fmtUptime(Date.now() - start)), 1000)
    return () => clearInterval(t)
  }, [status?.startTime])

  const isLive = status && Date.now() - status.startTime < 24 * 60 * 60 * 1000

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--poke-warm)] to-[var(--primary)] text-white shadow-md">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
        </div>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-[var(--foreground)]">戳一戳</h1>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
              isLive ? "bg-emerald-50 text-emerald-600 ring-emerald-500/20" : "bg-red-50 text-red-600 ring-red-500/20"
            }`}>
              <span className={`size-1.5 rounded-full mr-1.5 ${isLive ? "bg-emerald-500" : "bg-red-500"}`} />
              {isLive ? "运行中" : "连接失败"}
            </span>
          </div>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            {status ? `${status.enabledRulesCount}/${status.rulesCount} 条规则启用 · ${uptime}` : "—"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="触发总数" value={status?.totalCount ?? "—"} accent
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>} />
        <StatCard label="今日触发" value={status?.todayCount ?? "—"}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>} />
        <StatCard label="启用规则" value={status ? `${status.enabledRulesCount}/${status.rulesCount}` : "—"}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>} />
        <StatCard label="运行时长" value={uptime} mono
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} />
      </div>

      <Card>
        <CardHeader>
          <Label>实时动态</Label>
          <p className="text-xs text-[var(--muted-foreground)]">最近触发的事件</p>
        </CardHeader>
        <CardContent>
          {!status?.recentLogs?.length ? (
            <div className="py-16 text-center">
              <div className="inline-flex size-16 items-center justify-center rounded-2xl bg-[var(--accent)] mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-8 h-8 text-[var(--muted-foreground)]"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">暂无触发记录</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">有人戳一戳时这里会显示</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {status.recentLogs.map((log, i) => {
                const isCmd = log.action.startsWith("command:")
                const actionLabel = isCmd ? `触发: ${log.action.slice(8)}` : (ACTION_LABELS[log.action] ?? log.action)
                const actBadge = isCmd ? "border-violet-200 bg-violet-50 text-violet-700" : (ACTION_BADGE[log.action] ?? "border-[var(--border)] bg-[var(--accent)] text-[var(--muted-foreground)]")
                return (
                  <div key={i} className="flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--accent)] px-4 py-2.5 text-sm hover:opacity-80 transition-opacity">
                    <span className="font-mono text-sm font-semibold text-[var(--foreground)]">{log.pokerId}</span>
                    <span className="text-xs text-[var(--muted-foreground)]">→</span>
                    <span className="font-mono font-semibold text-[var(--foreground)]">{log.targetId}</span>
                    {log.groupId && (
                      <Badge className="shrink-0 border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] font-mono text-[10px]">群{log.groupId}</Badge>
                    )}
                    <Badge className={`shrink-0 text-[10px] ${log.isSelfPoke ? "border-rose-200 bg-rose-50/70 text-rose-600" : "border-sky-200 bg-sky-50/70 text-sky-600"}`}>
                      {log.isSelfPoke ? "→ 我" : "互戳"}
                    </Badge>
                    <Badge className={`shrink-0 text-[10px] ${actBadge}`}>{actionLabel}</Badge>
                    <span className="ml-auto shrink-0 tabular-nums text-xs text-[var(--muted-foreground)]">{fmtDateTime(log.time)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
