import { useEfficiency } from '@/stores/efficiency-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Classification {
  label: string
  minIdm: number
  color: string
  bgColor: string
  borderColor: string
  description: string
}

const CLASSIFICATIONS: Classification[] = [
  {
    label: 'Ótimo',
    minIdm: 90,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    description:
      'O sistema está operando dentro dos parâmetros ideais, indicando boa eficiência dos painéis e condições favoráveis de irradiação.',
  },
  {
    label: 'Bom',
    minIdm: 75,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    description:
      'O sistema apresenta desempenho adequado, porém pode haver margem para otimização através de limpeza dos módulos ou revisão de conexões.',
  },
  {
    label: 'Regular',
    minIdm: 60,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    description:
      'Recomenda-se investigar possíveis causas de subdesempenho, como sombreamento, sujidade nos painéis, ou falhas no inversor.',
  },
  {
    label: 'Ruim',
    minIdm: 0,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    description:
      'O desempenho crítico indica a necessidade de manutenção corretiva imediata. Sugere-se vistoria técnica detalhada dos módulos, inversores e cabeamento.',
  },
]

const getClassification = (idm: number): Classification => {
  return CLASSIFICATIONS.find((c) => idm >= c.minIdm) || CLASSIFICATIONS[CLASSIFICATIONS.length - 1]
}

export function EfficiencySummary() {
  const { report } = useEfficiency()

  if (!report || !report.summary) return null

  const activeClass = getClassification(report.avg_idm)

  return (
    <Card className="shadow-sm print:break-inside-avoid border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-primary flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Resumo Técnico da Análise
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed text-foreground/90 print:text-black">
          {report.summary}
        </p>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Classificações de Desempenho (IDM)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CLASSIFICATIONS.map((c) => {
              const isActive = c.label === activeClass.label
              return (
                <div
                  key={c.label}
                  className={cn(
                    'rounded-lg border p-3 transition-all',
                    c.bgColor,
                    c.borderColor,
                    isActive && 'ring-2 ring-primary/40 shadow-sm',
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {isActive && <Check className="h-3.5 w-3.5 text-primary" />}
                      <span className={cn('text-sm font-bold', c.color)}>{c.label}</span>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {c.label === 'Ruim' ? `< ${CLASSIFICATIONS[2].minIdm}%` : `≥ ${c.minIdm}%`}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug">{c.description}</p>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-2 mt-2 text-sm">
            <span className="text-muted-foreground">Classificação atual:</span>
            <span className={cn('font-bold', activeClass.color)}>
              {activeClass.label} (
              {report.avg_idm.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%)
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
