import { useSolar } from '@/stores/solar-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { BarChart, Bar, XAxis, CartesianGrid, AreaChart, Area } from 'recharts'
import { AlertCircle, TrendingDown, Battery, BatteryWarning, SunMedium } from 'lucide-react'

const chartConfig = {
  consumption: {
    label: 'Consumo',
    color: 'hsl(var(--chart-1))',
  },
  received: {
    label: 'Recebida',
    color: 'hsl(var(--chart-2))',
  },
  deficit: {
    label: 'Déficit',
    color: 'hsl(var(--chart-3))',
  },
} satisfies ChartConfig

export function ReportDashboard() {
  const { reportEntries } = useSolar()

  if (!reportEntries || reportEntries.length === 0) {
    return (
      <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-xl bg-muted/10 animate-fade-in">
        <img
          src="https://img.usecurling.com/p/300/200?q=solar%20panel&color=blue"
          alt="Painel Solar"
          className="mb-6 opacity-80 rounded-lg shadow-sm mix-blend-multiply dark:mix-blend-screen"
        />
        <h3 className="text-xl font-bold tracking-tight mb-2">Aguardando Dados</h3>
        <p className="text-muted-foreground max-w-sm">
          Insira seu histórico de consumo ao lado e clique em "Gerar Relatório" para visualizar sua
          análise detalhada.
        </p>
      </div>
    )
  }

  const totalConsumption = reportEntries.reduce((acc, e) => acc + (e.consumption || 0), 0)
  const totalReceived = reportEntries.reduce((acc, e) => acc + (e.received || 0), 0)

  const chartData = reportEntries.map((e) => {
    const deficit = Math.max(0, (e.consumption || 0) - (e.received || 0))
    let monthFormatted = e.month || 'N/A'

    if (e.month) {
      const [year, m] = e.month.split('-')
      const date = new Date(parseInt(year), parseInt(m) - 1)
      monthFormatted = date
        .toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
        .replace('.', '')
    }

    return {
      ...e,
      monthFormatted,
      deficit,
      consumption: e.consumption || 0,
      received: e.received || 0,
    }
  })

  const totalMissing = chartData.reduce((acc, e) => acc + e.deficit, 0)
  const count = reportEntries.length
  const avgConsumption = count ? totalConsumption / count : 0
  const avgReceived = count ? totalReceived / count : 0
  const avgMissing = count ? totalMissing / count : 0
  const coveragePercent = totalConsumption ? (totalReceived / totalConsumption) * 100 : 0

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Highlight Card */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 text-primary pointer-events-none">
          <AlertCircle className="w-32 h-32" />
        </div>
        <CardContent className="p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> Energia Faltante Total
            </p>
            <h2 className="text-5xl sm:text-6xl font-bold text-foreground tracking-tight">
              {totalMissing.toLocaleString('pt-BR')}
              <span className="text-2xl sm:text-3xl font-medium text-muted-foreground ml-2">
                kWh
              </span>
            </h2>
          </div>
          <div className="text-left sm:text-right bg-background/50 backdrop-blur-sm p-4 rounded-xl border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Período Analisado
            </p>
            <p className="text-2xl font-bold">
              {count} <span className="text-base font-normal text-muted-foreground">meses</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Média de Consumo"
          value={avgConsumption}
          icon={Battery}
          color="text-secondary"
        />
        <MetricCard
          title="Média de Créditos"
          value={avgReceived}
          icon={SunMedium}
          color="text-primary"
        />
        <MetricCard
          title="Cobertura"
          value={coveragePercent}
          suffix="%"
          icon={BatteryWarning}
          color="text-emerald-500"
        />
        <MetricCard
          title="Déficit Médio"
          value={avgMissing}
          icon={TrendingDown}
          color="text-destructive"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-muted-foreground">
              Consumo vs Recebida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full aspect-auto">
              <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.5} />
                <XAxis
                  dataKey="monthFormatted"
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
                <Bar
                  dataKey="consumption"
                  fill="var(--color-consumption)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="received"
                  fill="var(--color-received)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-muted-foreground">
              Evolução do Déficit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full aspect-auto">
              <AreaChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.5} />
                <XAxis
                  dataKey="monthFormatted"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={12}
                  fontSize={12}
                />
                <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                <Area
                  type="monotone"
                  dataKey="deficit"
                  name="deficit"
                  stroke="var(--color-deficit)"
                  fill="var(--color-deficit)"
                  strokeWidth={3}
                  fillOpacity={0.15}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MetricCard({ title, value, suffix = ' kWh', icon: Icon, color }: any) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
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
