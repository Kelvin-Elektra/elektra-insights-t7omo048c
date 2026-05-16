import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from 'next-themes'
import { SolarProvider } from '@/stores/solar-context'

import { RoleRouter } from './components/RoleRouter'
import AdminDashboard from './pages/AdminDashboard'
import UserDashboard from './pages/UserDashboard'
import UCAnalysis from './pages/UCAnalysis'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import AccessDenied from './pages/AccessDenied'
import { AuthProvider, useAuth } from './hooks/use-auth'

const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth()

  if (loading) return null

  if (user?.role_company !== 'admin' && user?.role !== 'User_owner') {
    return <Navigate to="/user" replace />
  }

  return <>{children}</>
}

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, error } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-lg text-primary">Autenticando...</div>
      </div>
    )
  }

  if (error || !user) {
    return <AccessDenied error={error} />
  }

  return <>{children}</>
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <AuthProvider>
      <SolarProvider>
        <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<RoleRouter />} />
                <Route
                  path="/admin"
                  element={
                    <AdminProtectedRoute>
                      <AdminDashboard />
                    </AdminProtectedRoute>
                  }
                />
                <Route path="/user" element={<UserDashboard />} />
                <Route path="/uc-analysis" element={<UCAnalysis />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </BrowserRouter>
      </SolarProvider>
    </AuthProvider>
  </ThemeProvider>
)

export default App
