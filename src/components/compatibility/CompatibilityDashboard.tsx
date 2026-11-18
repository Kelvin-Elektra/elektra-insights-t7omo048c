import { useCompatibility, TARIFF_CLASSES, DENOMINATOR } from '@/stores/compatibility-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Zap,
  Download,
  Save,
  Check,
  FileText,
  Scale,
  AlertTriangle,
  Info,
  Calculator,
  Sun,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface CompatibilityDashboardProps {
  onOpenEdit?: () => void
}

const fmt = (n: number, dec = 2) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec })

export function CompatibilityDashboard({ onOpenEdit }: CompatibilityDashboardProps = {}) {
  const {
    consumerName,
    avgConsumption,
    tariffClass,
    hasDaytimeMetering,
    daytimeConsumption,
    results,
    notes,
    saveAnalysisToHistory,
    isSaving,
    hasUnsavedChanges,
  } = useCompatibility()

  const handleSave = async () => {
    try {
      await saveAnalysisToHistory()
      toast.success('Análise de Compatibilidade de Consumo salva no Histórico!')
    } catch (e: any) {
      toast.error('Erro ao salvar no Histórico: ' + (e?.message || 'Tente novamente'))
    }
  }

  const handlePrint = () => {
    const originalTitle = document.title
    document.title = `Análise energética - ${consumerName || 'Cliente'}`
    window.print()
    setTimeout(() => {
      document.title = originalTitle
    }, 500)
  }

  if (!results) {
    return (
      <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-xl bg-muted/10 animate-fade-in">
        <Scale className="h-16 w-16 text-muted-foreground/30 mb-6" />
        <h3 className="text-xl font-bold tracking-tight mb-2">Aguardando Dados</h3>
        <p className="text-muted-foreground max-w-sm">
          Insira os dados de consumo e a classe tarifária, depois clique em &quot;Gerar Análise de
          Compatibilidade&quot; para visualizar o limite de potência de microgeração.
        </p>
      </div>
    )
  }

  const klass = TARIFF_CLASSES.find((c) => c.value === tariffClass)
  const klassLabel = klass?.label ?? tariffClass
  const avg = Number(avgConsumption.replace(',', '.')) || 0
  const day = Number(daytimeConsumption.replace(',', '.')) || 0
  const analysisDate = format(new Date(), 'dd/MM/yyyy')

  return (
    <div className="space-y-6 animate-fade-in-up print:m-0 max-w-5xl mx-auto">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden bg-muted/30 p-4 rounded-xl border">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">
            Limite por Compatibilidade de Consumo
          </h2>
          <p className="text-sm text-muted-foreground">
            {consumerName ? `${consumerName} • ` : ''}Data de análise: {analysisDate}
          </p>
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
          {onOpenEdit && (
            <Button onClick={onOpenEdit} variant="outline" size="sm" className="shadow-sm">
              Reabrir para Edição
            </Button>
          )}

          <Button
            onClick={handleSave}
            variant={hasUnsavedChanges ? 'default' : 'outline'}
            disabled={isSaving}
            className="shadow-sm transition-all"
            size="sm"
          >
            {hasUnsavedChanges ? (
              <Save className="h-4 w-4 mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2 text-emerald-500" />
            )}
            {isSaving
              ? 'Salvando...'
              : hasUnsavedChanges
                ? 'Salvar no Histórico'
                : 'Salvo no Histórico'}
          </Button>

          <Button
            onClick={handlePrint}
            variant="secondary"
            className="shadow-sm transition-all"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" /> Gerar PDF
          </Button>
        </div>
      </div>

      {/* Relatório Impresso / Visual */}
      <div className="report-print-container space-y-6 print:space-y-4">
        {/* Header no PDF */}
        <div className="hidden print:block text-center border-b pb-6 mb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Scale className="h-10 w-10 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">
              Análise de Compatibilidade de Consumo
            </h1>
          </div>
          {consumerName && (
            <div className="flex justify-center items-center gap-6 text-base font-medium mb-4 bg-muted/20 py-2 rounded-lg inline-flex px-8">
              <div>
                <span className="text-muted-foreground font-normal">Cliente:</span> {consumerName}
              </div>
            </div>
          )}
          <div className="flex justify-center gap-6 text-sm text-muted-foreground">
            <span>Data da análise: {analysisDate}</span>
          </div>
        </div>

        {/* Dados de entrada */}
        <Card className="shadow-sm print:break-inside-avoid">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-muted-foreground">
              Dados de Entrada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Consumo médio mensal (12 meses)
                </p>
                <p className="font-semibold text-lg">{fmt(avg)} kWh</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Classe tarifária
                </p>
                <p className="font-semibold text-lg leading-snug">{klassLabel}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Medição diurna (item 8.16)
                </p>
                <p className="font-semibold text-lg leading-snug">
                  {hasDaytimeMetering ? `${fmt(day)} kWh (informada)` : 'Não informada'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resultados — caminhos lado a lado */}
        <div className={hasDaytimeMetering ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : ''}>
          {/* Caminho com FA (art. 73-A, III) */}
          <Card className="shadow-sm print:break-inside-avoid border-primary/20 bg-gradient-to-br from-primary/5 to-background">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-primary flex items-center gap-1.5">
                <Zap className="h-4 w-4" />
                {hasDaytimeMetering
                  ? 'Caminho 1 — Com FA (consumo total)'
                  : 'Limite de Potência Calculado'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Resultado exato
                  </p>
                  <p className="text-2xl font-bold tracking-tight">{fmt(results.exactFa)} kW</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Arredondado para cima
                  </p>
                  <p className="text-4xl font-extrabold tracking-tight text-primary">
                    {fmt(results.roundedFa, 0)}{' '}
                    <span className="text-xl font-semibold text-muted-foreground">kW</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Caminho item 8.16 (sem FA) */}
          {hasDaytimeMetering && results.exactDaytime !== null && (
            <Card className="shadow-sm print:break-inside-avoid border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-background">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Sun className="h-4 w-4" />
                  Caminho 2 — Item 8.16 (medição diurna, sem FA)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Resultado exato
                    </p>
                    <p className="text-2xl font-bold tracking-tight">
                      {fmt(results.exactDaytime)} kW
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Arredondado para cima
                    </p>
                    <p className="text-4xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
                      {fmt(results.roundedDaytime ?? 0, 0)}{' '}
                      <span className="text-xl font-semibold text-muted-foreground">kW</span>
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ganho potencial:{' '}
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      +{fmt((results.roundedDaytime ?? 0) - results.roundedFa, 0)} kW
                    </span>{' '}
                    investindo na medição diurna (item 8.16).
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Memória de cálculo */}
        <Card className="shadow-sm print:break-inside-avoid">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-muted-foreground flex items-center gap-2">
              <Calculator className="h-4 w-4" /> Memória de Cálculo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>
                <strong>Denominador fixo:</strong> FC × 24 × 30 = 0,16 × 24 × 30 ={' '}
                {fmt(DENOMINATOR, 1)} (fator de capacidade solar de 16% — art. 655-B).
              </p>
              <p>
                <strong>Fórmula com FA (art. 73-A, III):</strong> Pg = C / 115,2 × FA = {fmt(avg)} /
                115,2 × {fmt(results.fa, 2)} = <strong>{fmt(results.exactFa)} kW</strong> →
                arredondado para cima: <strong>{fmt(results.roundedFa, 0)} kW</strong>.
              </p>
              {hasDaytimeMetering && results.exactDaytime !== null && (
                <p>
                  <strong>Fórmula do item 8.16 (sem FA):</strong> Pg = C_diurno / 115,2 = {fmt(day)}{' '}
                  / 115,2 = <strong>{fmt(results.exactDaytime)} kW</strong> → arredondado para cima:{' '}
                  <strong>{fmt(results.roundedDaytime ?? 0, 0)} kW</strong>.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Avisos e premissas */}
        <Card className="shadow-sm print:break-inside-avoid border-amber-500/20 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" /> Premissas e Avisos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-4">
              <li>
                Aplica-se somente ao enquadramento nos critérios de gratuidade do § 3º do art. 104,
                § 2º do art. 105 e parágrafo único do art. 106 da REN ANEEL 1.000/2021.
              </li>
              <li>
                Não se aplica a iluminação pública, consumo próprio, nem a UC com histórico menor
                que 12 ciclos (item 8.17).
              </li>
              <li>
                Pelo item 8.14, o valor liberado é o maior entre este resultado e a máxima potência
                injetável sem inversão de fluxo apurada pela distribuidora.
              </li>
              <li>
                Estimativa técnica de referência: não substitui o orçamento de conexão nem o estudo
                de inversão de fluxo.
              </li>
              <li>
                <Info className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
                Base legal: REN 1.000/2021, art. 73-A, III, e Manual de Instruções do art. 73, §1º,
                itens 8.12 a 8.19.
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Seção de Observação (exibida SEMPRE POR ÚLTIMO antes do rodapé) */}
        {notes && notes.trim() && (
          <Card className="shadow-sm print:break-inside-avoid border-primary/20 bg-muted/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-primary" /> Observações do Relatório
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                {notes}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="mt-auto pt-8 border-t text-center text-sm font-medium text-muted-foreground print:break-inside-avoid">
          <p className="hidden print:block">Elektra Insights — Compatibilidade de Consumo</p>
          <p className="print:hidden text-xs">Elektra Insights</p>
        </div>
      </div>
    </div>
  )
}
