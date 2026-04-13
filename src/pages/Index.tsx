import { DataEntryForm } from '@/components/solar/DataEntryForm'
import { ReportDashboard } from '@/components/solar/ReportDashboard'

const Index = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-4 lg:sticky lg:top-24">
        <DataEntryForm />
      </div>
      <div className="lg:col-span-8">
        <ReportDashboard />
      </div>
    </div>
  )
}

export default Index
