import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { FileBarChart2, SunMedium } from 'lucide-react'

export default function UserDashboard() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Meu Painel</h1>
        <p className="text-muted-foreground">Bem-vindo ao sistema de análise de energia solar.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SunMedium className="h-5 w-5 text-primary" />
              Análise de Energia
            </CardTitle>
            <CardDescription>
              Gere relatórios detalhados sobre o consumo e a energia injetada nas unidades
              consumidoras.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full sm:w-auto hover:scale-[1.02] transition-transform">
              <Link to="/uc-analysis">
                <FileBarChart2 className="mr-2 h-4 w-4" />
                Nova Análise
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
