import { Outlet, Link, useLocation } from 'react-router-dom'
import { Sun, Moon, PlusCircle, Zap, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'
import { useSolar } from '@/stores/solar-context'

export default function Layout() {
  const { theme, setTheme } = useTheme()
  const { reset } = useSolar()
  const location = useLocation()
  const isHub = location.pathname === '/'

  return (
    <div className="flex flex-col min-h-screen transition-colors duration-300">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm print:hidden">
        <div className="container max-w-6xl mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity"
            >
              <Zap className="h-6 w-6" />
              <span className="text-xl font-bold tracking-tight text-foreground">
                Elektra Insights
              </span>
            </Link>
            {!isHub && (
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground border-l pl-4 ml-2">
                <Link
                  to="/"
                  className="hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" /> Voltar ao Hub
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {!isHub && (
              <Button
                variant="outline"
                size="sm"
                onClick={reset}
                className="hover:scale-[1.02] transition-transform shadow-sm"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Novo Relatório</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="hover:scale-[1.05] transition-transform"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container max-w-6xl mx-auto py-8 px-4 animate-fade-in">
        <Outlet />
      </main>

      <footer className="border-t py-8 bg-card mt-auto print:hidden">
        <div className="container max-w-6xl mx-auto flex flex-col items-center justify-center text-sm text-muted-foreground gap-2">
          <p className="font-medium text-foreground">Elektra Insights</p>
          <p>© {new Date().getFullYear()} - Produto por Elektra Engenharia & Soluções.</p>
        </div>
      </footer>
    </div>
  )
}
