import { EnergyReportDashboard } from '@/components/energy/EnergyReportDashboard'
import { EnergyEntryForm } from '@/components/energy/EnergyEntryForm'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogHeader,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Edit } from 'lucide-react'
import { useState } from 'react'

export default function EnergyAnalysis() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="space-y-6 print:m-0 print:p-0 max-w-5xl mx-auto">
      <div className="flex justify-between items-center print:hidden border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Relatório de Balanço Energético & Geração
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Cruzamento entre histórico de consumo, energia injetada e geração fotovoltaica.
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="shadow-sm hover:border-primary/50">
              <Edit className="h-4 w-4 mr-2" />
              Editar Dados
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="mb-4 border-b pb-4">
              <DialogTitle className="text-2xl">Editar Dados do Relatório</DialogTitle>
              <DialogDescription className="text-base">
                Atualize os parâmetros da UC, valores de consumo, energia injetada e geração.
              </DialogDescription>
            </DialogHeader>
            <EnergyEntryForm onSuccess={() => setIsOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="print:w-full print:block">
        <EnergyReportDashboard onOpenEdit={() => setIsOpen(true)} />
      </div>
    </div>
  )
}
