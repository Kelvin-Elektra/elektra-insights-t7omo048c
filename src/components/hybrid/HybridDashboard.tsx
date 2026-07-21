import { useHybrid } from '@/stores/hybrid-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Zap, BatteryCharging, Download, SunMedium, Calculator } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function HybridDashboard() {
  const { results, customerName, batteryType, loads } = useHybrid()

  if (!results) {
    return (
      <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-xl bg-muted/10 animate-fade-in">
        <SunMedium className="h-16 w-16 text-muted-foreground/30 mb-6" />
        <h3 className="text-xl font-bold tracking-tight mb-2">Aguardando Dados</h3>
        <p className="text-muted-foreground max-w-sm">
          Insira os dados do cliente e as cargas críticas, depois clique em &quot;Gerar Análise
          Híbrida&quot; para visualizar o dimensionamento.
        </p>
      </div>
    )
  }

  const batteryLabel = batteryType === '100Ah' ? 'Bateria Lítio 100Ah' : 'Bateria Lítio 200Ah'

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
          <h1 className="text-3xl font-bold tracking-tight">Dimensionamento de Sistema Híbrido</h1>
        </div>
        {customerName && (
          <div className="flex justify-center items-center gap-6 text-base font-medium mb-4 bg-muted/20 py-2 rounded-lg inline-flex px-8">
            <div>
              <span className="text-muted-foreground font-normal">Cliente:</span> {customerName}
            </div>
          </div>
        )}
        <div className="flex justify-center gap-6 text-sm text-muted-foreground">
          <span>
            {batteryLabel} | Data: {new Date().toLocaleDateString('pt-BR')}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between print:hidden bg-muted/30 p-4 rounded-xl border">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">Dimensionamento Híbrido</h2>
          <p className="text-sm text-muted-foreground">
            {customerName ? `${customerName} • ` : ''}
            {batteryLabel} | Data de análise: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
        <Button
          onClick={() => {
            const originalTitle = document.title
            document.title = `Análise energética - ${customerName || 'Cliente'}`
            window.print()
            setTimeout(() => {
              document.title = originalTitle
            }, 500)
          }}
          className="shadow-sm hover:scale-105"
          size="sm"
        >
          <Download className="h-4 w-4 mr-2" /> Gerar PDF
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Potência Total"
          value={results.total_power}
          suffix=" W"
          icon={Zap}
          color="text-chart-1"
        />
        <MetricCard
          title="Energia Total"
          value={results.total_energy}
          suffix=" Wh"
          icon={Calculator}
          color="text-chart-2"
        />
        <MetricCard
          title="Inversor Mínimo"
          value={results.inverter_power}
          suffix=" W"
          icon={Zap}
          color="text-primary"
        />
        <MetricCard
          title="Qtd. Baterias"
          value={results.battery_qty}
          suffix={results.battery_qty === 1 ? ' un' : ' un'}
          icon={BatteryCharging}
          color="text-amber-500"
        />
      </div>

      <Card className="shadow-sm print:break-inside-avoid">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-muted-foreground">
            Cargas Críticas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Potência (W)</TableHead>
                  <TableHead className="text-right">Horas (h)</TableHead>
                  <TableHead className="text-right">Energia (Wh)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loads
                  .filter((l) => l.description.trim())
                  .map((load) => (
                    <TableRow key={load.id}>
                      <TableCell className="font-medium">{load.description}</TableCell>
                      <TableCell className="text-right">
                        {load.power.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        {load.hours.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {(load.power * load.hours).toLocaleString('pt-BR')}
                      </TableCell>
                    </TableRow>
                  ))}
                <TableRow className="bg-muted/50 font-bold border-t-2">
                  <TableCell colSpan={3} className="text-right">
                    Total
                  </TableCell>
                  <TableCell className="text-right text-primary">
                    {results.total_energy.toLocaleString('pt-BR')} Wh
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm print:break-inside-avoid border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-primary flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Premissas Técnicas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <PremiseChip label="Tensão do Sistema" value="48V" />
            <PremiseChip label="Bateria" value="Lítio" />
            <PremiseChip label="DoD" value="90%" />
            <PremiseChip label="Eficiência" value="100%" />
            <PremiseChip
              label="Capacidade Útil"
              value={`${results.useful_capacity.toLocaleString('pt-BR')} Wh`}
            />
          </div>
          <div className="mt-4 space-y-1 text-sm text-muted-foreground">
            <p>
              <strong>Potência do Inversor:</strong> Soma das potências de todas as cargas,
              arredondada para cima ({results.total_power.toLocaleString('pt-BR')} W →{' '}
              {results.inverter_power.toLocaleString('pt-BR')} W).
            </p>
            <p>
              <strong>Energia Total:</strong> Soma de (Potência × Horas) de cada carga ={' '}
              {results.total_energy.toLocaleString('pt-BR')} Wh.
            </p>
            <p>
              <strong>Quantidade de Baterias:</strong> Energia Total ÷ Capacidade Útil ={' '}
              {results.total_energy.toLocaleString('pt-BR')} ÷{' '}
              {results.useful_capacity.toLocaleString('pt-BR')} ={' '}
              {results.battery_qty.toLocaleString('pt-BR')} unidade(s).
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-auto pt-8 border-t text-center text-sm font-medium text-muted-foreground print:break-inside-avoid">
        <p className="hidden print:block">Elektra Insights</p>
        <p className="print:hidden text-xs">Elektra Insights</p>
      </div>
    </div>
  )
}

function MetricCard({ title, value, suffix = '', icon: Icon, color }: any) {
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

function PremiseChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-muted/40 rounded-lg px-3 py-1.5 border">
      <span className="text-xs text-muted-foreground">{label}:</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  )
}
