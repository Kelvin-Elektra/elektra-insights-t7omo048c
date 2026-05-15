import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Zap, LayoutDashboard, ArrowRight, FileText, CalendarDays } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { useSolar } from '@/stores/solar-context'
import { format } from 'date-fns'

export default function Hub() {
  const { user } = useAuth()
  const { loadAnalysis } = useSolar()
  const navigate = useNavigate()
  const [companyName, setCompanyName] = useState('Carregando...')
  const [recentAnalyses, setRecentAnalyses] = useState<any[]>([])

  useEffect(() => {
    if (user?.company) {
      pb.collection('companies')
        .getOne(user.company)
        .then((c) => setCompanyName(c.name))
        .catch(() => setCompanyName('Empresa Desconhecida'))
    }

    // Load recent analyses
    pb.collection('uc_analyses')
      .getList(1, 6, { sort: '-created' })
      .then((res) => setRecentAnalyses(res.items))
      .catch(console.error)
  }, [user])

  const handleOpenAnalysis = (record: any) => {
    loadAnalysis(record)
    navigate('/uc-analysis')
  }

  return (
    <div className="space-y-10 py-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Hub de Soluções
        </h1>
        <p className="text-lg text-muted-foreground flex items-center gap-2">
          Bem-vindo ao Elektra Insights,{' '}
          <span className="font-semibold text-foreground">{user?.name || user?.email}</span> |{' '}
          <span className="text-primary">{companyName}</span>
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

      {recentAnalyses.length > 0 && (
        <div className="space-y-4 animate-fade-in-up">
          <h2 className="text-2xl font-semibold tracking-tight border-b pb-2">Análises Recentes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentAnalyses.map((analysis) => (
              <Card
                key={analysis.id}
                className="hover:border-primary/30 transition-colors cursor-pointer bg-card/50"
                onClick={() => handleOpenAnalysis(analysis)}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-base line-clamp-1">
                      {analysis.consumer_name || 'Sem nome'}
                    </CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  </div>
                  <CardDescription className="text-xs font-mono">
                    {analysis.uc_number || 'Sem UC'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="flex items-center text-xs text-muted-foreground font-medium bg-muted/50 w-fit px-2 py-1 rounded-md">
                    <CalendarDays className="h-3 w-3 mr-1.5" />
                    {format(new Date(analysis.created), 'dd/MM/yyyy')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
