import ModulesAccess from '@/components/ModulesAccess'

export default function ModulesTest() {
  return (
    <div className="space-y-4">
      <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md font-medium inline-block mb-4">
        Modo de Teste (Administração Global)
      </div>
      <ModulesAccess />
    </div>
  )
}
