import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Zap, LayoutDashboard, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Hub() {
  return (
    <div className="space-y-8 py-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Hub de Soluções
        </h1>
        <p className="text-lg text-muted-foreground">
          Bem-vindo ao Elektra Insights. Selecione o módulo desejado abaixo para gerenciar suas
          análises.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link to="/uc-analysis" className="block group">
          <Card className="h-full border-2 border-transparent bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Análise de Energia UC</CardTitle>
              <CardDescription className="text-sm mt-2">
                Balanço energético de Unidades Consumidoras, cálculo de déficit de energia faltante
                e geração de relatórios PDF profissionais.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm font-semibold text-primary mt-2">
                Acessar Módulo{' '}
                <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="h-full opacity-60 cursor-not-allowed bg-muted/30 border-dashed">
          <CardHeader>
            <div className="bg-muted w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <LayoutDashboard className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl text-muted-foreground">Dimensionamento FV</CardTitle>
            <CardDescription className="text-sm mt-2">
              Em breve: Ferramenta avançada para dimensionamento de sistemas fotovoltaicos.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
