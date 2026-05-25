import { useState, useEffect, useCallback } from "react"
import { Card, CardHeader, CardContent, Label, Badge } from "../components"
import { API, apiFetch } from "../api"

interface PokeLogEntry {
  time: number
  botId: string
  pokerId: string
  targetId: string
  groupId?: string
  isSelfPoke: boolean
  ruleId: string
  ruleName: string
  action: string
}

function fmtDateTime(ts: number): string {
  return new Date(ts).toLocaleString("zh-CN", {
    month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  })
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

const FILTERS = [
  { key: "all", label: "全部" },
  { key: "self", label: "戳我" },
  { key: "other", label: "戳别人" },
] as const

export default function LogsPage() {
  const [logs, setLogs] = useState<PokeLogEntry[]>([])
  const [filter, setFilter] = useState<"all" | "self" | "other">("all")

  const load = useCallback(async () => {
    try {
      const r = await apiFetch(`${API}/logs?limit=100`).then((r) => r.json()) as { logs: PokeLogEntry[] }
      setLogs(r.logs || [])
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, 10000)
    return () => clearInterval(t)
  }, [load])

  const filtered = logs.filter((log) => {
    if (filter === "self") return log.isSelfPoke
    if (filter === "other") return !log.isSelfPoke
    return true
  })

  const clearLogs = () => setLogs([])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">触发记录</h1>
        <div className="flex gap-1.5">
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f.key ? "bg-slate-900 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}>
              {f.label}
            </button>
          ))}
          {filtered.length > 0 && (
            <button onClick={clearLogs}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors ml-2">
              清空
            </button>
          )}
        </div>
      </div>

      <Card className="flex-1">
        <CardHeader>
          <Label>历史记录</Label>
          <p className="text-xs text-slate-400">共 {filtered.length} 条{filter !== "all" ? `（${filter === "self" ? "戳我" : "戳别人"}）` : ""}</p>
        </CardHeader>
        <CardContent>
          {!filtered.length ? (
            <div className="py-16 text-center">
              <div className="text-4xl mb-3 opacity-20">📭</div>
              <p className="text-sm text-slate-400">暂无记录</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {filtered.map((log, i) => {
                const isCmd = log.action.startsWith("command:")
                const actionLabel = isCmd ? `指令: ${log.action.slice(8)}` : (ACTION_LABELS[log.action] ?? log.action)
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
                    {log.ruleName && (
                      <span className="text-xs text-slate-400 truncate max-w-24">「{log.ruleName}」</span>
                    )}
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
