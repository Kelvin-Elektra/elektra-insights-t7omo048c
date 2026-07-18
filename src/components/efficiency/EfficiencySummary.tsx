import { useEfficiency } from '@/stores/efficiency-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText } from 'lucide-react'

export function EfficiencySummary() {
  const { report } = useEfficiency()

  if (!report || !report.summary) return null

  return (
    <Card className="shadow-sm print:break-inside-avoid border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-primary flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Resumo Técnico da Análise
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-foreground/90 print:text-black">
          {report.summary}
        </p>
      </CardContent>
    </Card>
  )
}
