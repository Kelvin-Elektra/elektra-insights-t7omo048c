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

  if (!report || !report.adjusted_breakdown) return null

  return (
    <div className="space-y-6">
      <Card className="shadow-sm print:break-inside-avoid">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-muted-foreground">
            Geração mensal projetada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dias</TableHead>
                  <TableHead>Meses</TableHead>
                  <TableHead className="text-right">HSP</TableHead>
                  <TableHead className="text-right">Geração Projetada (kWh)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.adjusted_breakdown.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{item.days}</TableCell>
                    <TableCell className="font-medium capitalize">{item.month}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {item.hsp.toLocaleString('pt-BR', {
                        minimumFractionDigits: 3,
                        maximumFractionDigits: 3,
                      })}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {item.adjusted_generation.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-bold border-t-2">
                  <TableCell colSpan={3} className="text-right">
                    Média
                  </TableCell>
                  <TableCell className="text-right text-primary">
                    {(
                      report.adjusted_breakdown.reduce(
                        (sum, item) => sum + item.adjusted_generation,
                        0,
                      ) / 12
                    ).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
