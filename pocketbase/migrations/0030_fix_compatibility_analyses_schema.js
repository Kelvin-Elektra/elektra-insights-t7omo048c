/// <reference path="../pb_data/types.d.ts" />

// 0030 — Corrige o erro HTTP 400 "Failed to create record." ao salvar no
// Histórico em /compatibility-analysis.
//
// Causa investigada no backend live: a coleção `compatibility_analyses` existe
// com todos os campos que o frontend envia, PORÉM o campo relation `user`
// estava marcado como REQUIRED. O frontend envia `user` a partir do registro
// de sessão do authStore — quando esse valor não acompanha o create (ou a
// sessão foi emitida pelo fluxo SSO com authStore recarregado), o PocketBase
// devolve 400 de validação. Este migration torna `user` opcional (como nas
// demais coleções de análise, ex. `energy_analyses`, onde o mesmo padrão de
// payload salva sem erro) e reafirma as regras de API da 0029 — a criação
// continua exigindo autenticação e empresa do próprio usuário.
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('compatibility_analyses')
    const userField = collection.fields.getByName('user')
    let changed = false

    if (userField && userField.required) {
      userField.required = false
      changed = true
    }

    // Reafirma as regras definidas em 0029 (proteção contra drift manual):
    const rules = {
      listRule:
        "@request.auth.id != '' && (company = @request.auth.company || @request.auth.role = 'User_elektra')",
      viewRule:
        "@request.auth.id != '' && (company = @request.auth.company || @request.auth.role = 'User_elektra')",
      createRule: "@request.auth.id != '' && company = @request.auth.company",
      updateRule: "@request.auth.id != '' && company = @request.auth.company",
      deleteRule: "@request.auth.id != '' && company = @request.auth.company",
    }
    for (const [key, value] of Object.entries(rules)) {
      if (collection[key] !== value) {
        collection[key] = value
        changed = true
      }
    }

    if (changed) {
      app.save(collection)
    }
  },
  (app) => {
    // Down: volta a exigir `user` no create.
    const collection = app.findCollectionByNameOrId('compatibility_analyses')
    const userField = collection.fields.getByName('user')
    if (userField) {
      userField.required = true
    }
    app.save(collection)
  },
)
