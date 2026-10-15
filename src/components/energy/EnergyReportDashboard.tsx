import { useEnergy } from '@/stores/energy-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts'
import {
  AlertCircle,
  TrendingDown,
  Battery,
  SunMedium,
  Download,
  Gauge,
  Zap,
  TrendingUp,
  Percent,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EnergyProjectedTable } from '@/components/energy/EnergyProjectedTable'
import { EnergyVerticalReport } from '@/components/energy/EnergyVerticalReport'
import { EnergyEfficiencySummary } from '@/components/energy/EnergyEfficiencySummary'

const chartConfig3Bars = {
  consumption: {
    label: 'Consumo',
    color: 'hsl(var(--chart-1))',
  },
  received: {
    label: 'Energia Injetada',
    color: 'hsl(var(--chart-2))',
  },
  generation: {
    label: 'Geração',
    color: 'hsl(var(--chart-4, 217 91% 60%))',
  },
  deficit: {
    label: 'Déficit (Faltante)',
    color: 'hsl(var(--chart-3))',
  },
} satisfies ChartConfig

const chartConfigEfficiency = {
  real: {
    label: 'Geração Real',
    color: 'hsl(var(--chart-1))',
  },
  estimated: {
    label: 'Geração Projetada',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig

export function EnergyReportDashboard() {
  const { report, consumerName, ucNumber, cityName, state, kitPower, isEfficiencyMode } =
    useEnergy()

  if (!report || report.items.length === 0) {
    return (
      <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-xl bg-muted/10 animate-fade-in">
        <SunMedium className="h-16 w-16 text-muted-foreground/30 mb-6" />
        <h3 className="text-xl font-bold tracking-tight mb-2">Aguardando Dados</h3>
        <p className="text-muted-foreground max-w-sm">
          Insira os dados do período ao lado e clique em &quot;Gerar Relatório Completo&quot; para
          visualizar o cruzamento de consumo, energia injetada e geração.
        </p>
      </div>
    )
  }

  const chartDataBars = report.items.map((item) => ({
    month: item.month_label,
    consumption: item.consumption,
    received: item.received,
    generation: item.generation,
    deficit: item.deficit,
  }))

  const chartDataEfficiency = report.items.map((item) => ({
    month: item.month_label,
    real: Math.round(item.generation),
    estimated: Math.round(item.estimated_generation || 0),
  }))

  const chartHeightEfficiency = Math.max(260, report.items.length * 60 + 70)

  const hasEfficiency = report.mode === 'efficiency' && report.avg_idm !== undefined
  const idmColor =
    (report.avg_idm || 0) >= 90
      ? 'text-emerald-500'
      : (report.avg_idm || 0) >= 75
        ? 'text-amber-500'
        : (report.avg_idm || 0) >= 60
          ? 'text-orange-500'
          : 'text-destructive'

  const totalDelta = report.total_delta ?? 0
  const deltaPct = report.delta_percentage ?? 0

  const handlePrint = () => {
    const originalTitle = document.title
    document.title = `Análise energética - ${consumerName || 'Cliente'}`
    window.print()
    setTimeout(() => {
      document.title = originalTitle
    }, 500)
  }

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
          @page :first { margin-top: 0; }
        }
      `}</style>

      {/* Print Header */}
      <div className="hidden print:block text-center border-b pb-6 mb-6">
        <div className="flex items-center justify-center gap-3 mb-4">
          <SunMedium className="h-10 w-10 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Relatório de Balanço Energético & Geração
          </h1>
        </div>

        {(consumerName || ucNumber) && (
          <div className="flex justify-center items-center gap-6 text-base font-medium mb-3 bg-muted/20 py-2 rounded-lg inline-flex px-8">
            {consumerName && (
              <div>
                <span className="text-muted-foreground font-normal">Cliente/Consumidor:</span>{' '}
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

        <div className="flex justify-center gap-6 text-sm text-muted-foreground">
          {hasEfficiency && cityName && state && (
            <span>
              {cityName} - {state} {kitPower ? `| Kit: ${kitPower} kWp` : ''}
            </span>
          )}
          <span>
            Modo: {hasEfficiency ? 'Análise de Eficiência Integrada' : 'Geração Declarada'}
          </span>
          <span>Data de análise: {new Date().toLocaleDateString('pt-BR')}</span>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between print:hidden bg-muted/30 p-4 rounded-xl border border-border/50">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">
            Relatório Completo — Consumo x Injetada x Geração
          </h2>
          <p className="text-sm text-muted-foreground">
            {consumerName ? `${consumerName} • ` : ''}
            {ucNumber ? `UC: ${ucNumber} • ` : ''}
            {hasEfficiency ? 'Com análise de eficiência (HSP)' : 'Geração declarada do período'}
            {' • '}Data de análise: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
        <Button
          onClick={handlePrint}
          className="shadow-sm transition-all hover:scale-105"
          size="sm"
        >
          <Download className="h-4 w-4 mr-2" /> Gerar PDF
        </Button>
      </div>

      {/* Cards de Destaque Principais */}
      {hasEfficiency ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card Destaque: IDM da Eficiência */}
          <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20 shadow-sm relative overflow-hidden print:shadow-none">
            <div className="absolute top-0 right-0 p-8 opacity-10 text-primary pointer-events-none">
              <Gauge className="w-28 h-28" />
            </div>
            <CardContent className="p-6 flex flex-col justify-between gap-4 relative z-10">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Gauge className="h-4 w-4" /> Índice de Desempenho Médio (IDM)
                </p>
                <h2 className={`text-4xl sm:text-5xl font-bold tracking-tight ${idmColor}`}>
                  {report.avg_idm?.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
                  <span className="text-xl font-medium text-muted-foreground ml-1.5">%</span>
                </h2>
              </div>
              <div className="pt-2 border-t flex justify-between items-center text-xs text-muted-foreground">
                <span>Delta Real - Proj.:</span>
                <span
                  className={`font-bold ${totalDelta >= 0 ? 'text-emerald-500' : 'text-destructive'}`}
                >
                  {totalDelta >= 0 ? '+' : ''}
                  {totalDelta.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kWh (
                  {deltaPct >= 0 ? '+' : ''}
                  {deltaPct.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%)
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Card Destaque: Déficit da UC */}
          <Card className="bg-gradient-to-br from-destructive/10 via-destructive/5 to-background border-destructive/20 shadow-sm relative overflow-hidden print:shadow-none">
            <div className="absolute top-0 right-0 p-8 opacity-10 text-destructive pointer-events-none">
              <AlertCircle className="w-28 h-28" />
            </div>
            <CardContent className="p-6 flex flex-col justify-between gap-4 relative z-10">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-destructive flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" /> Energia Faltante Total (Déficit)
                </p>
                <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
                  {report.total_deficit.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
                  <span className="text-xl font-medium text-muted-foreground ml-1.5">kWh</span>
                </h2>
              </div>
              <div className="pt-2 border-t flex justify-between items-center text-xs text-muted-foreground">
                <span>Período analisado:</span>
                <span className="font-semibold text-foreground">
                  {report.items.length} {report.items.length === 1 ? 'mês' : 'meses'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20 shadow-sm relative overflow-hidden print:shadow-none print:border-border">
          <div className="absolute top-0 right-0 p-8 opacity-10 text-primary pointer-events-none">
            <AlertCircle className="w-32 h-32" />
          </div>
          <CardContent className="p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> Energia Faltante Total (Déficit)
              </p>
              <h2 className="text-5xl sm:text-6xl font-bold text-foreground tracking-tight">
                {report.total_deficit.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
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
                {report.items.length}{' '}
                <span className="text-base font-normal text-muted-foreground">meses</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid de Métricas Chave do Cruzamento */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Consumo Total"
          value={report.total_consumption}
          icon={Battery}
          color="text-chart-1"
        />
        <MetricCard
          title="Energia Injetada Total"
          value={report.total_received}
          icon={SunMedium}
          color="text-chart-2"
        />
        <MetricCard
          title={hasEfficiency ? 'Geração Real Total' : 'Geração Declarada'}
          value={report.total_generation}
          icon={Zap}
          color="text-blue-500"
        />
        <MetricCard
          title="Cobertura Injetada"
          value={report.coverage_percent}
          suffix="%"
          icon={Percent}
          color="text-emerald-500"
        />
      </div>

      {/* Gráficos de Cruzamento: Consumo x Injetada x Geração */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 print:flex print:flex-col print:items-center print:gap-8 print:w-full">
        {/* Gráfico 1: Barras comparativas 3 grandezas */}
        <Card className="shadow-sm print:break-inside-avoid print:shadow-none print:w-full print:border-none">
          <CardHeader className="pb-2 print:text-center">
            <CardTitle className="text-base font-semibold text-muted-foreground">
              Consumo vs Energia Injetada vs Geração (kWh)
            </CardTitle>
          </CardHeader>
          <CardContent className="print:flex print:justify-center print:items-center print:w-full print:p-0">
            <ChartContainer
              config={chartConfig3Bars}
              className="h-[320px] w-full aspect-auto print:w-[650px] print:h-[320px] print:mx-auto"
            >
              <BarChart data={chartDataBars} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
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
                <Bar
                  dataKey="consumption"
                  fill="var(--color-consumption)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  dataKey="received"
                  fill="var(--color-received)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  dataKey="generation"
                  fill="var(--color-generation)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Gráfico 2: Evolução do Déficit da UC */}
        <Card className="shadow-sm print:break-inside-avoid print:shadow-none mt-6 xl:mt-0 print:w-full print:border-none print:mt-10">
          <CardHeader className="pb-2 print:text-center">
            <CardTitle className="text-base font-semibold text-muted-foreground">
              Evolução do Déficit Energético (Consumo - Injetada)
            </CardTitle>
          </CardHeader>
          <CardContent className="print:flex print:justify-center print:items-center print:w-full print:p-0">
            <ChartContainer
              config={chartConfig3Bars}
              className="h-[320px] w-full aspect-auto print:w-[650px] print:h-[320px] print:mx-auto"
            >
              <AreaChart data={chartDataBars} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.5} />
                <XAxis
                  dataKey="month"
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

      {/* Seção Exclusiva da Análise de Eficiência (quando modo está ativo) */}
      {hasEfficiency && (
        <div className="space-y-6 pt-4 border-t print:border-t-0">
          <div className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold tracking-tight">
              Análise de Eficiência do Sistema Solar
            </h3>
          </div>

          {/* Gráfico Vertical Adaptativo: Geração Real vs Projetada */}
          <Card className="shadow-sm print:break-inside-avoid">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-muted-foreground">
                Geração Real vs Projetada (kWh)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={chartConfigEfficiency}
                className="w-full aspect-auto"
                style={{ height: `${chartHeightEfficiency}px` }}
              >
                <BarChart
                  layout="vertical"
                  data={chartDataEfficiency}
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid
                    horizontal={false}
                    vertical={true}
                    strokeDasharray="3 3"
                    opacity={0.5}
                  />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={12}
                  />
                  <YAxis
                    type="category"
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={12}
                    width={80}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent indicator="dot" />}
                    cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                  />
                  <ChartLegend content={<ChartLegendContent />} className="mt-4" />
                  <Bar
                    dataKey="real"
                    fill="var(--color-real)"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={28}
                  />
                  <Bar
                    dataKey="estimated"
                    fill="var(--color-estimated)"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={28}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Tabela Geração Mensal Projetada (sem Ideal nem Eficiência na tela) */}
          <EnergyProjectedTable />

          {/* Relatório Vertical Esperado vs Real */}
          <EnergyVerticalReport />

          {/* Resumo Técnico e Classificação IDM */}
          <EnergyEfficiencySummary />
        </div>
      )}

      {/* Tabela Resumo Consolidado de Todos os Meses (Consumo x Injetada x Geração x Balanço) */}
      <Card className="shadow-sm print:break-inside-avoid">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-muted-foreground">
            Balanço Mensal Detalhado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-muted-foreground font-semibold">
                <tr>
                  <th className="py-2.5 px-3 text-left">Mês</th>
                  <th className="py-2.5 px-3 text-right">Consumo (kWh)</th>
                  <th className="py-2.5 px-3 text-right">Injetada (kWh)</th>
                  <th className="py-2.5 px-3 text-right">
                    {hasEfficiency ? 'Geração Real (kWh)' : 'Geração (kWh)'}
                  </th>
                  <th className="py-2.5 px-3 text-right">Déficit (kWh)</th>
                  <th className="py-2.5 px-3 text-right">Saldo (Geração - Consumo)</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {report.items.map((it) => (
                  <tr key={it.id} className="hover:bg-muted/20">
                    <td className="py-2.5 px-3 font-medium">{it.month_label}</td>
                    <td className="py-2.5 px-3 text-right">
                      {it.consumption.toLocaleString('pt-BR')}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {it.received.toLocaleString('pt-BR')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium">
                      {it.generation.toLocaleString('pt-BR')}
                    </td>
                    <td className="py-2.5 px-3 text-right text-destructive font-medium">
                      {it.deficit.toLocaleString('pt-BR')}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-semibold ${
                        it.balance >= 0 ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {it.balance >= 0 ? '+' : ''}
                      {it.balance.toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))}
                <tr className="bg-muted/60 font-bold border-t-2">
                  <td className="py-3 px-3">Total</td>
                  <td className="py-3 px-3 text-right">
                    {report.total_consumption.toLocaleString('pt-BR')}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {report.total_received.toLocaleString('pt-BR')}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {report.total_generation.toLocaleString('pt-BR')}
                  </td>
                  <td className="py-3 px-3 text-right text-destructive">
                    {report.total_deficit.toLocaleString('pt-BR')}
                  </td>
                  <td
                    className={`py-3 px-3 text-right ${
                      report.total_generation - report.total_consumption >= 0
                        ? 'text-emerald-600'
                        : 'text-amber-600'
                    }`}
                  >
                    {report.total_generation - report.total_consumption >= 0 ? '+' : ''}
                    {(report.total_generation - report.total_consumption).toLocaleString('pt-BR')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Print Footer */}
      <div className="hidden print:block mt-auto pt-8 border-t text-center text-sm font-bold text-foreground print:break-inside-avoid w-full">
        <p>Produto por Elektra Engenharia & Soluções</p>
        <p className="text-xs text-muted-foreground font-normal mt-1">
          Elektra Insights - Análise Integrada de Energia Solar
        </p>
      </div>

      <div className="print:hidden text-center text-xs text-muted-foreground pt-4 border-t">
        Powered by Elektra Insights
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
