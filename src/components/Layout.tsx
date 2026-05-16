import { Outlet, Link, useLocation } from 'react-router-dom'
import { Sun, Moon, PlusCircle, Zap, LogOut, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'
import { useSolar } from '@/stores/solar-context'
import { useAuth } from '@/hooks/use-auth'
import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

export default function Layout() {
  const { theme, setTheme } = useTheme()
  const { reset } = useSolar()
  const { user, logout } = useAuth()
  const location = useLocation()

  const [company, setCompany] = useState<any>(null)

  useEffect(() => {
    if (user?.company) {
      pb.collection('companies').getOne(user.company).then(setCompany).catch(console.error)
    }
  }, [user?.company])

  const isAdmin = user?.role_company === 'admin' || user?.role === 'User_owner'
  const isElektra = user?.role === 'User_elektra'

  const links = isElektra
    ? [
        { name: 'Manutenção', to: '/' },
        { name: 'Histórico Global', to: '/history' },
        { name: 'Módulos (Teste)', to: '/modules-test' },
      ]
    : isAdmin
      ? [
          { name: 'Módulos', to: '/' },
          { name: 'Histórico', to: '/history' },
          { name: 'Configurações', to: '/settings' },
        ]
      : [
          { name: 'Módulos', to: '/' },
          { name: 'Meu Histórico', to: '/history' },
        ]

  const isMainRoute = links.some((link) => location.pathname === link.to)

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {links.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary',
            location.pathname === link.to ? 'text-primary' : 'text-muted-foreground',
            mobile && 'block py-2 text-lg',
          )}
        >
          {link.name}
        </Link>
      ))}
    </>
  )

  return (
    <div className="flex flex-col min-h-screen transition-colors duration-300">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm print:hidden">
        <div className="container max-w-6xl mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>Navegação</SheetTitle>
                </SheetHeader>
                <nav className="mt-6 flex flex-col gap-2">
                  <NavLinks mobile />
                </nav>
              </SheetContent>
            </Sheet>

            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              {company?.logo ? (
                <img
                  src={pb.files.getURL(company, company.logo)}
                  alt={company.name}
                  className="h-8 max-w-[120px] object-contain"
                />
              ) : (
                <>
                  <Zap className="h-6 w-6 text-primary" />
                  <span className="text-xl font-bold tracking-tight text-foreground hidden sm:inline-block">
                    Elektra Insights
                  </span>
                </>
              )}
            </Link>

            <nav className="hidden md:flex items-center gap-6 ml-6">
              <NavLinks />
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {!isMainRoute && (
              <Button
                variant="outline"
                size="sm"
                onClick={reset}
                className="hover:scale-[1.02] transition-transform shadow-sm hidden sm:flex"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                <span>Novo Relatório</span>
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
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground"
              title="Sair"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container max-w-6xl mx-auto py-8 px-4 animate-fade-in-up">
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
