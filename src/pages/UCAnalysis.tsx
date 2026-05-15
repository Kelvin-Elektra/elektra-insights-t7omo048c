import { DataEntryForm } from '@/components/solar/DataEntryForm'
import { ReportDashboard } from '@/components/solar/ReportDashboard'

export default function UCAnalysis() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start print:block print:w-full print:m-0 print:p-0">
      <div className="lg:col-span-4 lg:sticky lg:top-24 print:hidden">
        <DataEntryForm />
      </div>
      <div className="lg:col-span-8 print:w-full print:block">
        <ReportDashboard />
      </div>
    </div>
  )
}
