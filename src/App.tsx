import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from 'next-themes'
import { SolarProvider } from '@/stores/solar-context'

import Index from './pages/Index'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <SolarProvider>
      <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </SolarProvider>
  </ThemeProvider>
)

export default App
