import { useEfficiency } from '@/stores/efficiency-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowUp, ArrowDown, FileText } from 'lucide-react'

export function EfficiencyVerticalReport() {
  const { report } = useEfficiency()

  if (!report || !report.items || report.items.length === 0) return null

  return (
    <Card className="shadow-sm print:break-inside-avoid border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-primary">
          Relatório Vertical — Esperado vs. Real
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {report.items.map((item, idx) => {
          const delta = item.real_generation - item.estimated
          const isPositive = delta >= 0
          const idmColor =
            item.idm >= 100
              ? 'text-emerald-500'
              : item.idm >= 75
                ? 'text-amber-500'
                : 'text-destructive'

          return (
            <div
              key={idx}
              className="rounded-xl border p-4 space-y-3 transition-all hover:border-primary/40 hover:shadow-sm print:break-inside-avoid"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold tracking-tight">{item.month_label}</span>
                <span className={`text-sm font-bold ${idmColor}`}>
                  IDM: {item.idm.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Esperado
                  </p>
                  <p className="text-lg font-bold text-muted-foreground">
                    {item.estimated.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
                  </p>
                  <p className="text-xs text-muted-foreground">kWh</p>
                </div>
                <div className="bg-primary/5 rounded-lg p-3 text-center border border-primary/10">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                    Real
                  </p>
                  <p className="text-lg font-bold text-primary">
                    {item.real_generation.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
                  </p>
                  <p className="text-xs text-muted-foreground">kWh</p>
                </div>
              </div>
              <div
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold ${
                  isPositive
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-destructive/10 text-destructive'
                }`}
              >
                {isPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                {isPositive ? '+' : ''}
                {delta.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kWh
                <span className="text-xs opacity-70">
                  ({isPositive ? '+' : ''}
                  {item.estimated > 0
                    ? ((delta / item.estimated) * 100).toLocaleString('pt-BR', {
                        maximumFractionDigits: 1,
                      })
                    : '0'}
                  %)
                </span>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
