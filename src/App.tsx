import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from 'next-themes'
import { SolarProvider } from '@/stores/solar-context'
import { EfficiencyProvider } from '@/stores/efficiency-context'

import Dashboard from './pages/Dashboard'
import ModulesTest from './pages/ModulesTest'
import History from './pages/History'
import Settings from './pages/Settings'
import UCAnalysis from './pages/UCAnalysis'
import EfficiencyAnalysis from './pages/EfficiencyAnalysis'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import AccessDenied from './pages/AccessDenied'
import Index from './pages/Index'
import ElektraAdminLogin from './pages/ElektraAdminLogin'
import HspLookup from './pages/HspLookup'
import { AuthProvider, useAuth } from './hooks/use-auth'

const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user?.role_company !== 'admin' && user?.role !== 'User_owner') {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

const ElektraProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user?.role !== 'User_elektra') {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, error } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted/40">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <div className="animate-pulse text-lg font-medium text-muted-foreground">
          Autenticando...
        </div>
      </div>
    )
  }

  if (error) {
    return <AccessDenied error={error} />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light">
    <AuthProvider>
      <SolarProvider>
        <EfficiencyProvider>
          <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Routes>
                <Route path="/login" element={<Index />} />
                <Route path="/elektra-admin" element={<ElektraAdminLogin />} />
                <Route
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/uc-analysis" element={<UCAnalysis />} />
                  <Route path="/efficiency-analysis" element={<EfficiencyAnalysis />} />
                  <Route
                    path="/settings"
                    element={
                      <AdminProtectedRoute>
                        <Settings />
                      </AdminProtectedRoute>
                    }
                  />
                  <Route
                    path="/modules-test"
                    element={
                      <ElektraProtectedRoute>
                        <ModulesTest />
                      </ElektraProtectedRoute>
                    }
                  />
                  <Route
                    path="/hsp-lookup"
                    element={
                      <ElektraProtectedRoute>
                        <HspLookup />
                      </ElektraProtectedRoute>
                    }
                  />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </TooltipProvider>
          </BrowserRouter>
        </EfficiencyProvider>
      </SolarProvider>
    </AuthProvider>
  </ThemeProvider>
)

export default App
