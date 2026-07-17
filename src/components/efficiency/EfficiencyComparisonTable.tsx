import { useEfficiency } from '@/stores/efficiency-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function EfficiencyComparisonTable() {
  const { report } = useEfficiency()

  if (!report || report.items.length === 0) return null

  return (
    <Card className="shadow-sm print:break-inside-avoid">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-muted-foreground">
          Comparativo Mensal Detalhado (HSP Ponderado)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês</TableHead>
                <TableHead className="text-right">HSP</TableHead>
                <TableHead className="text-right">Peso</TableHead>
                <TableHead className="text-right">Esperado (kWh)</TableHead>
                <TableHead className="text-right">Real (kWh)</TableHead>
                <TableHead className="text-right">Delta (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.items.map((item, idx) => {
                const deltaPct =
                  item.estimated > 0
                    ? ((item.real_generation - item.estimated) / item.estimated) * 100
                    : 0
                return (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{item.month_label}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {item.hsp_value.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {(item.monthly_weight * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {item.estimated.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {item.real_generation.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                    </TableCell>
                    <TableCell
                      className={`text-right font-semibold ${deltaPct >= 0 ? 'text-emerald-500' : 'text-destructive'}`}
                    >
                      {deltaPct >= 0 ? '+' : ''}
                      {deltaPct.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
