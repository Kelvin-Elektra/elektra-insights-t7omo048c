import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Building2, Info, Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'

export default function Settings() {
  const { user } = useAuth()
  const [company, setCompany] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user?.company) {
      pb.collection('companies')
        .getOne(user.company)
        .then((record) => {
          setCompany(record)
          setName(record.name)
          if (record.logo) {
            setLogoPreview(pb.files.getURL(record, record.logo))
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [user?.company])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      if (file.size > 2 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 2MB.')
        return
      }
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  const handleSave = async () => {
    if (!company) return

    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('name', name)

      if (logoFile) {
        formData.append('logo', logoFile)
      }

      const updated = await pb.collection('companies').update(company.id, formData)
      setCompany(updated)
      toast.success('Configurações salvas com sucesso!')

      // Reload page layout to reflect new logo
      setTimeout(() => window.location.reload(), 1000)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao salvar configurações.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações da Empresa</h1>
        <p className="text-muted-foreground">Gerencie a identidade visual e informações básicas.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Identidade
          </CardTitle>
          <CardDescription>
            Atualize o nome da empresa e o logotipo que aparecerá nos relatórios.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="companyName">Nome da Empresa</Label>
            <Input
              id="companyName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Minha Empresa de Energia"
            />
          </div>

          <div className="space-y-3">
            <Label>Logotipo (Máx: 2MB, JPG/PNG)</Label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="h-20 w-32 border rounded-md flex items-center justify-center bg-muted/30 overflow-hidden shrink-0">
                {logoPreview ? (
                  <img src={logoPreview} alt="Preview" className="h-full w-full object-contain" />
                ) : (
                  <Building2 className="h-8 w-8 text-muted-foreground/50" />
                )}
              </div>

              <div className="space-y-2">
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/svg+xml,image/webp"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Escolher Imagem
                </Button>
                {logoFile && <p className="text-xs text-muted-foreground">{logoFile.name}</p>}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t p-6">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Alterações'
            )}
          </Button>
        </CardFooter>
      </Card>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Gerenciamento de Usuários</AlertTitle>
        <AlertDescription>
          O cadastro, remoção e atribuição de permissões de usuários são centralizados no{' '}
          <strong>Elektra Hub</strong>. As alterações feitas lá refletirão automaticamente aqui.
        </AlertDescription>
      </Alert>
    </div>
  )
}
