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
import {
  AlertCircle,
  TrendingDown,
  Battery,
  BatteryWarning,
  SunMedium,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

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
  const { reportEntries, consumerName, ucNumber } = useSolar()

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

    if (e.month && e.month.includes('/')) {
      const [m, y] = e.month.split('/')
      const date = new Date(parseInt(y), parseInt(m) - 1)
      if (!isNaN(date.getTime())) {
        monthFormatted = date
          .toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
          .replace('.', '')
      }
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
    <div className="space-y-6 animate-fade-in-up print:m-0 print:space-y-6 max-w-5xl mx-auto">
      <style>{`
        @media print {
          body { 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
            background: white;
            padding: 15mm; 
          }
          @page { margin: 0; size: A4 portrait; }
          .lucide { width: 1.2rem; height: 1.2rem; }
          
          /* Remove browser headers/footers */
          @page :first {
            margin-top: 0;
          }
        }
      `}</style>

      {/* Print Header */}
      <div className="hidden print:block text-center border-b pb-6 mb-6">
        <div className="flex items-center justify-center gap-3 mb-4">
          <SunMedium className="h-10 w-10 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Relatório de Energia Solar
          </h1>
        </div>

        {(consumerName || ucNumber) && (
          <div className="flex justify-center items-center gap-6 text-base font-medium mb-4 bg-muted/20 py-2 rounded-lg inline-flex px-8">
            {consumerName && (
              <div>
                <span className="text-muted-foreground font-normal">Consumidor:</span>{' '}
                {consumerName}
              </div>
            )}
            {ucNumber && (
              <div>
                <span className="text-muted-foreground font-normal">UC:</span> {ucNumber}
              </div>
            )}
          </div>
        )}

        <p className="text-muted-foreground text-sm">
          Análise de Energia da Unidade Consumidora • Gerado em{' '}
          {new Date().toLocaleDateString('pt-BR')}
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between print:hidden bg-muted/30 p-4 rounded-xl border border-border/50">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">Análise de Desempenho</h2>
          <p className="text-sm text-muted-foreground">
            Visualize o balanço energético da sua unidade e exporte o documento.
          </p>
        </div>
        <Button
          onClick={() => window.print()}
          className="shadow-sm transition-all hover:scale-105"
          size="sm"
        >
          <Download className="h-4 w-4 mr-2" /> Gerar PDF
        </Button>
      </div>

      {/* Highlight Card */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20 shadow-sm relative overflow-hidden print:shadow-none print:border-border">
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
          title="Média Injetada"
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
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 print:flex print:flex-col print:items-center print:gap-8 print:w-full">
        <Card className="shadow-sm print:break-inside-avoid print:shadow-none print:w-full">
          <CardHeader className="pb-2 print:text-center">
            <CardTitle className="text-base font-semibold text-muted-foreground">
              Consumo vs Energia Recebida
            </CardTitle>
          </CardHeader>
          <CardContent className="print:flex print:justify-center print:items-center print:w-full">
            <ChartContainer
              config={chartConfig}
              className="h-[300px] w-full aspect-auto print:max-w-3xl print:mx-auto"
            >
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

        <Card className="shadow-sm print:break-inside-avoid print:shadow-none mt-6 xl:mt-0 print:w-full">
          <CardHeader className="pb-2 print:text-center">
            <CardTitle className="text-base font-semibold text-muted-foreground">
              Evolução do Déficit Energético
            </CardTitle>
          </CardHeader>
          <CardContent className="print:flex print:justify-center print:items-center print:w-full">
            <ChartContainer
              config={chartConfig}
              className="h-[300px] w-full aspect-auto print:max-w-3xl print:mx-auto"
            >
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

      {/* Print Footer */}
      <div className="hidden print:block mt-auto pt-8 border-t text-center text-sm font-bold text-foreground print:break-inside-avoid w-full">
        <p>Produto por Elektra Engenharia & Soluções</p>
        <p className="text-xs text-muted-foreground font-normal mt-1">
          Elektra Insights - Sistema de Análise Energética
        </p>
      </div>
    </div>
  )
}

function MetricCard({ title, value, suffix = ' kWh', icon: Icon, color }: any) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow print:shadow-none print:border-border print:break-inside-avoid">
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
