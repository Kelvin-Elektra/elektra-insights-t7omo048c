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
  const { report, kitPower, expectedAvgGeneration } = useEfficiency()

  if (!report || !report.ideal_breakdown) return null

  return (
    <div className="space-y-6">
      <Card className="shadow-sm print:break-inside-avoid">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-muted-foreground">
            Geração Ideal (Sem Ajuste)
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
                  <TableHead className="text-right">Geração Ideal (kWh)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.ideal_breakdown.map((item, idx) => (
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
                      {item.ideal_generation.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-bold border-t-2">
                  <TableCell colSpan={2} className="text-right">
                    Média
                  </TableCell>
                  <TableCell className="text-right">
                    {(
                      report.ideal_breakdown.reduce((sum, item) => sum + item.hsp, 0) / 12
                    ).toLocaleString('pt-BR', {
                      minimumFractionDigits: 4,
                      maximumFractionDigits: 4,
                    })}
                  </TableCell>
                  <TableCell className="text-right text-primary">
                    {report.ideal_average.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-4 items-center justify-between text-sm bg-muted/20 p-4 rounded-lg border">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-medium uppercase tracking-wider text-xs">
                Eficiência do Sistema:
              </span>
              <span className="font-bold text-xl text-primary">
                {report.efficiency_factor.toLocaleString('pt-BR', {
                  minimumFractionDigits: 7,
                  maximumFractionDigits: 7,
                })}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 sm:gap-8 bg-background px-4 py-2 rounded-md border">
              <div>
                <span className="text-muted-foreground text-xs uppercase tracking-wider mr-1">
                  Kit:
                </span>
                <span className="font-semibold">{kitPower} kWp</span>
              </div>
              <div>
                <span className="text-muted-foreground text-xs uppercase tracking-wider mr-1">
                  Geração Esperada:
                </span>
                <span className="font-semibold">{expectedAvgGeneration} kWh</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm print:break-inside-avoid mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-muted-foreground">
            Geração Ajustada (Com Eficiência)
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
                  <TableHead className="text-right">Geração Ajustada (kWh)</TableHead>
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
                  <TableCell colSpan={2} className="text-right">
                    Média
                  </TableCell>
                  <TableCell className="text-right"></TableCell>
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

      {report.items && report.items.length > 0 && (
        <Card className="shadow-sm print:break-inside-avoid mt-6 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-primary">
              Análise dos Meses Inseridos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês/Ano</TableHead>
                    <TableHead className="text-right">HSP</TableHead>
                    <TableHead className="text-right">Esperado (kWh)</TableHead>
                    <TableHead className="text-right">Real (kWh)</TableHead>
                    <TableHead className="text-right">Desempenho (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.items.map((item, idx) => {
                    return (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{item.month_label}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {item.hsp_value.toLocaleString('pt-BR', {
                            minimumFractionDigits: 3,
                            maximumFractionDigits: 3,
                          })}
                        </TableCell>
                        <TableCell className="text-right font-medium text-muted-foreground">
                          {item.estimated.toLocaleString('pt-BR', {
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {item.real_generation.toLocaleString('pt-BR', {
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell
                          className={`text-right font-semibold ${item.idm >= 100 ? 'text-emerald-500' : 'text-destructive'}`}
                        >
                          {item.idm.toLocaleString('pt-BR', {
                            maximumFractionDigits: 2,
                          })}
                          %
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
