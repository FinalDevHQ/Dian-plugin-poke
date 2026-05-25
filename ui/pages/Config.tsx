import { useState, useEffect, useCallback } from "react"
import { Card, CardHeader, CardContent, Label, Input, Button, Toggle, Select, Checkbox } from "../components"
import { API, apiFetch } from "../api"

interface PokeRule {
  id: string
  name: string
  enabled: boolean
  matchSelf: boolean
  matchOthers: boolean
  groupIds: string[]
  action: "poke_back" | "follow" | "command" | "message"
  followTarget: "poker" | "targeted"
  commandText: string
  messageText: string
  cooldown: number
}

interface PokeConfig {
  globalCooldown: number
  rules: PokeRule[]
  disabledGroups: string[]
  blacklist: string[]
}

const ACTION_DEFS = [
  { value: "poke_back", label: "戳回去", color: "border-l-rose-500 bg-rose-50/40", badge: "border-rose-200 bg-rose-50 text-rose-700" },
  { value: "follow", label: "跟戳", color: "border-l-amber-500 bg-amber-50/40", badge: "border-amber-200 bg-amber-50 text-amber-700" },
  { value: "command", label: "触发指令", color: "border-l-blue-500 bg-blue-50/40", badge: "border-blue-200 bg-blue-50 text-blue-700" },
  { value: "message", label: "回复消息", color: "border-l-emerald-500 bg-emerald-50/40", badge: "border-emerald-200 bg-emerald-50 text-emerald-700" },
]

const FOLLOW_OPTIONS = [
  { value: "poker", label: "戳戳人的人" },
  { value: "targeted", label: "戳被戳的人" },
]

const ACTION_OPTIONS = ACTION_DEFS.map((d) => ({ value: d.value, label: d.label }))

let idCounter = Date.now()
function newRule(): PokeRule {
  return {
    id: `rule_${++idCounter}`, name: "", enabled: true,
    matchSelf: true, matchOthers: false, groupIds: [],
    action: "poke_back", followTarget: "poker",
    commandText: "", messageText: "", cooldown: 0,
  }
}

function ActionForm({ rule, onChange }: { rule: PokeRule; onChange: (p: Partial<PokeRule>) => void }) {
  switch (rule.action) {
    case "follow":
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500">跟戳目标：</span>
          <Select value={rule.followTarget} onChange={(v) => onChange({ followTarget: v as PokeRule["followTarget"] })} options={FOLLOW_OPTIONS} className="w-44" />
        </div>
      )
    case "command":
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500">触发指令：</span>
          <Input placeholder="例如: !签到" value={rule.commandText} onChange={(e) => onChange({ commandText: e.target.value })} className="font-mono max-w-64" />
        </div>
      )
    case "message":
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500">回复内容：</span>
          <Input placeholder="例如: 别戳了！" value={rule.messageText} onChange={(e) => onChange({ messageText: e.target.value })} className="max-w-64" />
        </div>
      )
    default:
      return null
  }
}

function CopyBtn({ text }: { text: string }) {
  const copy = () => {
    navigator.clipboard.writeText(text).catch(() => {})
  }
  return (
    <button onClick={copy} className="text-[10px] text-slate-400 hover:text-slate-600 underline decoration-dotted shrink-0" title="点击复制示例">
      示例
    </button>
  )
}

function GroupPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [groups, setGroups] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchGroups = useCallback(async () => {
    setLoading(true)
    try {
      const r = await apiFetch(`${API}/groups`).then((r2) => r2.json()) as { groups: string[] }
      setGroups(r.groups || [])
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { if (open) fetchGroups() }, [open, fetchGroups])

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((g) => g !== id) : [...value, id])
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-slate-500">限定群（空=所有群）</label>
      <div className="flex gap-2 items-center">
        <div className="flex-1 flex gap-1.5 flex-wrap min-h-[2.5rem] items-center rounded-xl border border-slate-200 bg-white px-3 py-1.5">
          {value.length === 0 && <span className="text-xs text-slate-400">未限定</span>}
          {value.map((g) => (
            <span key={g} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-mono">
              {g}
              <button onClick={() => onChange(value.filter((x) => x !== g))} className="text-slate-400 hover:text-slate-700">x</button>
            </span>
          ))}
        </div>
        <button onClick={() => setOpen(!open)}
          className="shrink-0 h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-500 hover:bg-slate-50 transition-colors">
          {open ? "收起" : "选择群"}
        </button>
      </div>
      {open && (
        <div className="rounded-xl border border-slate-200 bg-white p-3 max-h-48 overflow-y-auto">
          {loading ? (
            <p className="text-xs text-slate-400 text-center py-2">加载中...</p>
          ) : groups.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-2">
              暂无可用群列表<br />
              <span className="text-[10px]">请在输入框中手动输入群号</span>
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-2 text-xs text-slate-500 pb-1 border-b border-slate-100 mb-1">
                <Checkbox
                  checked={value.length === groups.length}
                  onChange={(v) => onChange(v ? [...groups] : [])}
                  label="全选"
                />
                <span className="text-slate-400">（共 {groups.length} 个群）</span>
              </label>
              {groups.map((g) => (
                <label key={g} className="flex items-center gap-2 text-sm hover:bg-slate-50 -mx-1 px-2 py-0.5 rounded-lg cursor-pointer">
                  <input type="checkbox" checked={value.includes(g)} onChange={() => toggle(g)}
                    className="size-4 rounded border-slate-300 text-slate-900 focus:ring-slate-300" />
                  <span className="font-mono text-xs">{g}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ConfigPage({ showToast }: { showToast: (msg: string, ok?: boolean) => void }) {
  const [cfg, setCfg] = useState<PokeConfig | null>(null)
  const [saving, setSaving] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState<Set<string>>(new Set())
  const [showFormatGuide, setShowFormatGuide] = useState(false)

  const load = useCallback(async () => {
    try {
      const r = await apiFetch(`${API}/status`).then((r) => r.json()) as { config: PokeConfig }
      setCfg(r.config)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { load() }, [load])

  const updateRule = (ruleId: string, patch: Partial<PokeRule>) => {
    if (!cfg) return
    setCfg({ ...cfg, rules: cfg.rules.map((r) => r.id === ruleId ? { ...r, ...patch } : r) })
  }

  const deleteRule = (ruleId: string) => {
    if (!cfg || !confirm("确定删除此规则？")) return
    setCfg({ ...cfg, rules: cfg.rules.filter((r) => r.id !== ruleId) })
  }

  const addRule = () => {
    if (!cfg) return
    const rule = newRule()
    setCfg({ ...cfg, rules: [...cfg.rules, rule] })
    setShowAdvanced((prev) => new Set(prev).add(rule.id))
  }

  const duplicateRule = (rule: PokeRule) => {
    if (!cfg) return
    const newR = { ...newRule(), name: rule.name + " (副本)", ...rule, id: `rule_${++idCounter}` }
    setCfg({ ...cfg, rules: [...cfg.rules, newR] })
  }

  const moveRule = (idx: number, dir: -1 | 1) => {
    if (!cfg) return
    const rules = [...cfg.rules]
    const target = idx + dir
    if (target < 0 || target >= rules.length) return
    ;[rules[idx], rules[target]] = [rules[target], rules[idx]]
    setCfg({ ...cfg, rules })
  }

  const toggleAdvanced = (id: string) => {
    const next = new Set(showAdvanced)
    if (next.has(id)) next.delete(id); else next.add(id)
    setShowAdvanced(next)
  }

  const save = async () => {
    if (!cfg) return
    setSaving(true)
    try {
      const r = await apiFetch(`${API}/config`, {
        method: "POST",
        body: JSON.stringify(cfg),
      })
      const res = await r.json()
      showToast(res.ok ? "保存成功" : "保存失败", res.ok)
      if (res.ok) load()
    } catch {
      showToast("保存失败", false)
    } finally {
      setSaving(false)
    }
  }

  if (!cfg) return <p className="text-sm text-slate-400 text-center py-12">加载中...</p>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">规则配置</h1>
        <Button onClick={save} disabled={saving}>
          {saving ? "保存中..." : "保存配置"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Label>全局设置</Label>
              <p className="text-xs text-slate-400">影响所有规则的通用配置</p>
            </div>
            <button onClick={() => setShowFormatGuide(!showFormatGuide)}
              className="text-xs text-slate-400 hover:text-slate-600 underline decoration-dotted">
              {showFormatGuide ? "收起" : "格式说明"}
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500">全局冷却</label>
              <div className="flex items-center gap-2">
                <Input type="number" min={0} value={cfg.globalCooldown}
                  onChange={(e) => setCfg({ ...cfg, globalCooldown: parseInt(e.target.value) || 0 })}
                  className="w-24" />
                <span className="text-xs text-slate-400">秒（0=不限制）</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-500">禁用群号</label>
                <CopyBtn text="12345678,87654321" />
              </div>
              <Input placeholder="12345678,87654321"
                value={cfg.disabledGroups.join(",")}
                onChange={(e) => setCfg({ ...cfg, disabledGroups: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-500">用户黑名单</label>
                <CopyBtn text="10001,10002,10003" />
              </div>
              <Input placeholder="10001,10002,10003"
                value={cfg.blacklist.join(",")}
                onChange={(e) => setCfg({ ...cfg, blacklist: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
            </div>
          </div>

          {showFormatGuide && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-xs font-medium text-slate-700 mb-2">格式说明</p>
                <p className="text-xs text-slate-500">多个值用英文逗号分隔，例如：<code className="font-mono text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200 select-all">12345678,23456789,34567890</code></p>
                <p className="text-xs text-slate-500 mt-1">点击上方示例文字可复制到剪贴板</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base">触发规则</Label>
          <p className="text-xs text-slate-400 mt-0.5">
            {cfg.rules.filter((r) => r.enabled).length}/{cfg.rules.length} 条启用，按顺序依次匹配
          </p>
        </div>
        <div className="flex gap-2">
          {cfg.rules.length > 0 && (
            <Button variant="ghost" onClick={() => { if (confirm("确定清空所有规则？")) setCfg({ ...cfg, rules: [] }) }}
              className="text-xs text-red-500 hover:text-red-700">清空</Button>
          )}
          <Button variant="secondary" onClick={addRule} className="gap-1.5 whitespace-nowrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            添加规则
          </Button>
        </div>
      </div>

      {cfg.rules.length === 0 ? (
        <Card>
          <CardContent>
            <div className="py-16 text-center">
              <div className="text-4xl mb-3 opacity-20">📋</div>
              <p className="text-sm text-slate-400 mb-3">还没有任何规则</p>
              <Button variant="secondary" onClick={addRule}>+ 创建第一条规则</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {cfg.rules.map((rule, idx) => {
            const def = ACTION_DEFS.find((d) => d.value === rule.action)
            return (
              <div key={rule.id}
                className={`rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,.04)] border-l-[3px] ${def?.color ?? "border-l-slate-300"} ${rule.enabled ? "" : "opacity-55"}`}>
                <div className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Toggle checked={rule.enabled} onChange={(v) => updateRule(rule.id, { enabled: v })} />
                    <Input placeholder="规则名称（选填）" value={rule.name}
                      onChange={(e) => updateRule(rule.id, { name: e.target.value })}
                      className="h-8 text-sm font-medium border-0 bg-transparent px-0 focus:border-b focus:rounded-none focus:ring-0 w-48" />
                    <span className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-[11px] font-semibold shrink-0 ${def?.badge ?? ""}`}>
                      {def?.label ?? rule.action}
                    </span>
                    <div className="flex items-center gap-1 ml-auto">
                      <button onClick={() => toggleAdvanced(rule.id)}
                        className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors">
                        {showAdvanced.has(rule.id) ? "收起高级" : "高级"}
                      </button>
                      <button onClick={() => duplicateRule(rule)}
                        className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors">复制</button>
                      <button onClick={() => moveRule(idx, -1)} disabled={idx === 0}
                        className="text-xs text-slate-400 hover:text-slate-600 px-1.5 py-1 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-30">↑</button>
                      <button onClick={() => moveRule(idx, 1)} disabled={idx === cfg.rules.length - 1}
                        className="text-xs text-slate-400 hover:text-slate-600 px-1.5 py-1 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-30">↓</button>
                      <button onClick={() => deleteRule(rule.id)}
                        className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors ml-1">删除</button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-3 flex-wrap">
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-slate-400">匹配：</span>
                      <Checkbox checked={rule.matchSelf} onChange={(v) => updateRule(rule.id, { matchSelf: v })} label="戳我" />
                      <Checkbox checked={rule.matchOthers} onChange={(v) => updateRule(rule.id, { matchOthers: v })} label="戳别人" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <ActionForm rule={rule} onChange={(p) => updateRule(rule.id, p)} />
                    </div>
                  </div>

                  {showAdvanced.has(rule.id) && (
                    <div className="mt-3 pt-3 border-t border-slate-100 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <GroupPicker value={rule.groupIds} onChange={(v) => updateRule(rule.id, { groupIds: v })} />
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-slate-500">冷却时间</label>
                        <div className="flex items-center gap-2">
                          <Input type="number" min={0} value={rule.cooldown}
                            onChange={(e) => updateRule(rule.id, { cooldown: parseInt(e.target.value) || 0 })}
                            className="w-24" />
                          <span className="text-xs text-slate-400">秒（0=全局）</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-slate-500">动作</label>
                        <Select value={rule.action} onChange={(v) => updateRule(rule.id, { action: v as PokeRule["action"] })} options={ACTION_OPTIONS} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex justify-center pt-2 pb-6">
        <Button onClick={save} disabled={saving} className="px-8">
          {saving ? "保存中..." : "保存全部配置"}
        </Button>
      </div>
    </div>
  )
}
