import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { FileBarChart2, SunMedium } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
  DialogHeader,
} from '@/components/ui/dialog'
import { DataEntryForm } from '@/components/solar/DataEntryForm'
import { useAuth } from '@/hooks/use-auth'
import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

export default function ModulesAccess() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Painel do Cliente</h1>
        <p className="text-muted-foreground">Acesse as ferramentas de análise de energia.</p>
      </div>

      <div className="mb-8 max-w-md bg-muted/30 p-4 rounded-xl border">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Empresa / Cliente
        </Label>
        <Input
          value={user?.company_name || 'Empresa não informada'}
          readOnly
          disabled
          className="mt-1.5 bg-background font-medium h-11"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Card className="hover:shadow-lg transition-all border-primary/30 cursor-pointer group p-4 border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl group-hover:text-primary transition-colors">
                  <SunMedium className="h-8 w-8 text-primary" />
                  Análise histórica de consumo x injetada
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  Gere relatório para demonstrar ao seu cliente o montante faltante de energia em
                  sua UC.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full sm:w-auto hover:scale-[1.02] transition-transform text-lg py-6 px-8 shadow-md">
                  <FileBarChart2 className="mr-2 h-5 w-5" />
                  Iniciar Nova Análise
                </Button>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="mb-4 border-b pb-4">
              <DialogTitle className="text-2xl">Nova Análise de UC</DialogTitle>
              <DialogDescription className="text-base">
                Insira os dados de consumo para gerar o relatório do balanço energético.
              </DialogDescription>
            </DialogHeader>
            <DataEntryForm
              onSuccess={() => {
                setIsOpen(false)
                navigate('/uc-analysis')
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
