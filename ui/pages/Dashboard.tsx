import { useState, useEffect, useCallback } from "react"
import { Card, CardHeader, CardContent, Label, Badge } from "../components"

const API = "/plugins/poke/api"

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
      const r = await fetch(`${API}/status`).then((r) => r.json()) as Status
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
        <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white text-3xl shadow-md">
          👉
        </div>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900">戳一戳</h1>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
              isLive ? "bg-emerald-50 text-emerald-600 ring-emerald-500/20" : "bg-red-50 text-red-600 ring-red-500/20"
            }`}>
              <span className={`size-1.5 rounded-full mr-1.5 ${isLive ? "bg-emerald-500" : "bg-red-500"}`} />
              {isLive ? "运行中" : "连接失败"}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-0.5">
            {status ? `${status.enabledRulesCount}/${status.rulesCount} 条规则启用 · ${uptime}` : "—"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatBox label="触发总数" value={status?.totalCount ?? "—"} />
        <StatBox label="今日触发" value={status?.todayCount ?? "—"} />
        <StatBox label="启用规则" value={status ? `${status.enabledRulesCount}/${status.rulesCount}` : "—"} />
        <StatBox label="运行时长" value={uptime} />
      </div>

      <Card>
        <CardHeader>
          <Label>实时动态</Label>
          <p className="text-xs text-slate-400">最近触发的事件</p>
        </CardHeader>
        <CardContent>
          {!status?.recentLogs?.length ? (
            <div className="py-16 text-center">
              <div className="text-4xl mb-3 opacity-20">🫸</div>
              <p className="text-sm text-slate-400">暂无触发记录<br /><span className="text-xs">有人戳一戳时这里会显示</span></p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {status.recentLogs.map((log, i) => {
                const isCmd = log.action.startsWith("command:")
                const actionLabel = isCmd ? `触发: ${log.action.slice(8)}` : (ACTION_LABELS[log.action] ?? log.action)
                const actBadge = isCmd ? "border-violet-200 bg-violet-50 text-violet-700" : (ACTION_BADGE[log.action] ?? "border-slate-200 bg-slate-100 text-slate-600")
                return (
                  <div key={i} className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors">
                    <span className="font-mono text-sm font-semibold text-slate-800">{log.pokerId}</span>
                    <span className="text-xs text-slate-400">→</span>
                    <span className="font-mono font-semibold text-slate-800">{log.targetId}</span>
                    {log.groupId && (
                      <Badge className="shrink-0 border-slate-200 bg-white text-slate-500 font-mono text-[10px]">群{log.groupId}</Badge>
                    )}
                    <Badge className={`shrink-0 text-[10px] ${log.isSelfPoke ? "border-rose-200 bg-rose-50/70 text-rose-600" : "border-sky-200 bg-sky-50/70 text-sky-600"}`}>
                      {log.isSelfPoke ? "→ 我" : "互戳"}
                    </Badge>
                    <Badge className={`shrink-0 text-[10px] ${actBadge}`}>{actionLabel}</Badge>
                    <span className="ml-auto shrink-0 tabular-nums text-xs text-slate-400">{fmtDateTime(log.time)}</span>
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

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,.04)]">
      <p className="text-xs font-medium text-slate-400 tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-slate-900 mt-1.5 tabular-nums">{value}</p>
    </div>
  )
}
