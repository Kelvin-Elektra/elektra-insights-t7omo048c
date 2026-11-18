/// <reference path="../pb_data/types.d.ts" />

// 0031 — Reafirma o schema e as regras de API de `compatibility_analyses`
// (idempotente) depois de confirmar, com o hook de diagnóstico temporário, que
// o mesmo payload do frontend cria o registro com sucesso quando autenticado:
// a causa do 400 era requisição rodando como guest (sessão inválida), não schema.
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('compatibility_analyses')
    const userField = collection.fields.getByName('user')
    let changed = false

    // O frontend envia `user` a partir da sessão; manter opcional (igual às demais
    // coleções de análise) evita 400 quando o valor não acompanha o create.
    if (userField && userField.required) {
      userField.required = false
      changed = true
    }

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
