import { useEfficiency } from '@/stores/efficiency-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { BarChart, Bar, XAxis, CartesianGrid } from 'recharts'
import { Gauge, Zap, TrendingUp, Download, SunMedium, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

const chartConfig = {
  real: { label: 'Geracao Real', color: 'hsl(var(--chart-1))' },
  estimated: { label: 'Geracao Estimada', color: 'hsl(var(--chart-2))' },
} satisfies ChartConfig

export function EfficiencyDashboard() {
  const { report, cityName, state, kitPower } = useEfficiency()

  if (!report || report.items.length === 0) {
    return (
      <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-xl bg-muted/10 animate-fade-in">
        <SunMedium className="h-16 w-16 text-muted-foreground/30 mb-6" />
        <h3 className="text-xl font-bold tracking-tight mb-2">Aguardando Dados</h3>
        <p className="text-muted-foreground max-w-sm">
          Insira os dados do seu kit solar e clique em &quot;Gerar Analise&quot; para visualizar a
          comparacao de eficiencia.
        </p>
      </div>
    )
  }

  const chartData = report.items.map((item) => ({
    month: item.month_label,
    real: Math.round(item.real_generation),
    estimated: Math.round(item.estimated),
  }))

  const idmColor =
    report.avg_idm >= 90
      ? 'text-emerald-500'
      : report.avg_idm >= 70
        ? 'text-amber-500'
        : 'text-destructive'

  return (
    <div className="space-y-6 animate-fade-in-up print:m-0 max-w-5xl mx-auto">
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; padding: 15mm; }
          @page { margin: 0; size: A4 portrait; }
        }
      `}</style>

      <div className="hidden print:block text-center border-b pb-6 mb-6">
        <div className="flex items-center justify-center gap-3 mb-4">
          <SunMedium className="h-10 w-10 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Analise de Eficiencia Energetica</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          {cityName} - {state} | Kit: {kitPower} kWp | Gerado em{' '}
          {new Date().toLocaleDateString('pt-BR')}
        </p>
      </div>

      <div className="flex items-center justify-between print:hidden bg-muted/30 p-4 rounded-xl border">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">Analise de Eficiencia</h2>
          <p className="text-sm text-muted-foreground">
            {cityName} - {state} | Kit: {kitPower} kWp
          </p>
        </div>
        <Button onClick={() => window.print()} className="shadow-sm hover:scale-105" size="sm">
          <Download className="h-4 w-4 mr-2" /> Gerar PDF
        </Button>
      </div>

      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 text-primary pointer-events-none">
          <Gauge className="w-32 h-32" />
        </div>
        <CardContent className="p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary flex items-center gap-2">
              <Gauge className="h-4 w-4" /> Indice de Desempenho Medio (IDM)
            </p>
            <h2 className={`text-5xl sm:text-6xl font-bold tracking-tight ${idmColor}`}>
              {report.avg_idm.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
              <span className="text-2xl font-medium text-muted-foreground ml-2">%</span>
            </h2>
          </div>
          <div className="text-left sm:text-right bg-background/50 backdrop-blur-sm p-4 rounded-xl border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Fator de Perda
            </p>
            <p className="text-2xl font-bold">
              {report.loss_factor.toLocaleString('pt-BR', { maximumFractionDigits: 3 })}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <MetricCard
          title="Geracao Real Total"
          value={report.total_real}
          icon={Zap}
          color="text-chart-1"
        />
        <MetricCard
          title="Geracao Estimada Total"
          value={report.total_estimated}
          icon={TrendingUp}
          color="text-chart-2"
        />
        <MetricCard
          title="Meses Analisados"
          value={report.items.length}
          suffix=""
          icon={AlertCircle}
          color="text-primary"
        />
      </div>

      <Card className="shadow-sm print:break-inside-avoid">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-muted-foreground">
            Geracao Real vs Estimada (kWh)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[350px] w-full aspect-auto">
            <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.5} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                fontSize={12}
              />
              <ChartTooltip
                content={<ChartTooltipContent indicator="dot" />}
                cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
              />
              <ChartLegend content={<ChartLegendContent />} className="mt-4" />
              <Bar dataKey="real" fill="var(--color-real)" radius={[4, 4, 0, 0]} maxBarSize={50} />
              <Bar
                dataKey="estimated"
                fill="var(--color-estimated)"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="hidden print:block mt-auto pt-8 border-t text-center text-sm font-bold">
        <p>Produto por Elektra Engenharia & Solucoes</p>
      </div>
    </div>
  )
}

function MetricCard({ title, value, suffix = ' kWh', icon: Icon, color }: any) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow print:shadow-none print:break-inside-avoid">
      <CardContent className="p-5 flex flex-col items-start gap-3">
        <div className={`p-2 rounded-lg bg-muted/50 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider line-clamp-1">
            {title}
          </p>
          <p className="text-2xl font-bold tracking-tight">
            {value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
            <span className="text-sm font-medium text-muted-foreground ml-1">{suffix}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
