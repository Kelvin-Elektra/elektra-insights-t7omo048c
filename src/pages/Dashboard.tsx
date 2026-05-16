import { useAuth } from '@/hooks/use-auth'
import MaintenanceDashboard from '@/components/MaintenanceDashboard'
import ModulesAccess from '@/components/ModulesAccess'

export default function Dashboard() {
  const { user } = useAuth()
  const isElektra = user?.role === 'User_elektra'

  if (isElektra) {
    return <MaintenanceDashboard />
  }

  return <ModulesAccess />
}
