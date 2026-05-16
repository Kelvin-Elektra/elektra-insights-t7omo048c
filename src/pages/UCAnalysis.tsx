import { ReportDashboard } from '@/components/solar/ReportDashboard'
import { DataEntryForm } from '@/components/solar/DataEntryForm'
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

export default function UCAnalysis() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="space-y-6 print:m-0 print:p-0 max-w-5xl mx-auto">
      <div className="flex justify-between items-center print:hidden border-b pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Relatório da UC</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="shadow-sm hover:border-primary/50">
              <Edit className="h-4 w-4 mr-2" />
              Editar Dados
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="mb-4 border-b pb-4">
              <DialogTitle className="text-2xl">Editar Dados da UC</DialogTitle>
              <DialogDescription className="text-base">
                Atualize os valores de consumo e energia injetada.
              </DialogDescription>
            </DialogHeader>
            <DataEntryForm onSuccess={() => setIsOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      <div className="print:w-full print:block">
        <ReportDashboard />
      </div>
    </div>
  )
}
