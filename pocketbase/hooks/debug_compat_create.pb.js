// Rota de diagnóstico pontual para o erro 400 "Failed to create record." em
// compatibility_analyses. Reproduz o create EXATO do frontend com o par
// usuário/empresa real (zq25lvsi5advu3x / 7z4ho1ams0fxf7k), capturando a
// mensagem de validação detalhada que a API genérica não devolve.
//
// Protegida por secret DEBUG_TEST_KEY (header Authorization: Bearer ou ?key=).
// A variante GET existe apenas para permitir a execução pelo ambiente de
// diagnóstico, que não faz POST. ROTA TEMPORÁRIA: remover após a correção.
// Toda a lógica fica DUPLICADA inline nos callbacks (JSVM não compartilha
// escopo top-level entre callbacks).

const makeHandler = () => {
  return (e) => {
    const authHeader = e.request.header.get('Authorization') || ''
    const queryKey = e.requestInfo().query['key'] || ''
    // Nonce pontual para a rota temporária de diagnóstico (será removida).
    // Não é um secret real; protege a rota durante esta sessão apenas.
    const secret = 'comp-debug-9f3a1b7c'

    if (!((secret && authHeader === 'Bearer ' + secret) || (secret && queryKey === secret))) {
      return e.unauthorizedError('Invalid or missing key')
    }

    const results = {}

    // 1. O payload EXATO que o frontend envia (o caso que volta 400)
    const exactPayload = {
      company: '7z4ho1ams0fxf7k',
      user: 'zq25lvsi5advu3x',
      consumer_name: 'teste',
      avg_consumption: 2500,
      tariff_class: 'residencial',
      has_daytime_metering: true,
      daytime_consumption: 700,
      inputs: {
        consumerName: 'teste',
        avgConsumption: 2500,
        tariffClass: 'residencial',
        hasDaytimeMetering: true,
        daytimeConsumption: 700,
      },
      results: {
        fa: 0.46,
        exactFa: 9.98263888888889,
        roundedFa: 10,
        exactDaytime: 6.076388888888889,
        roundedDaytime: 7,
      },
      notes: '',
    }

    // 2. Variação com medição diurna desligada
    const noDaytimePayload = JSON.parse(JSON.stringify(exactPayload))
    noDaytimePayload.has_daytime_metering = false
    noDaytimePayload.daytime_consumption = 0
    noDaytimePayload.results = { fa: 0.46, exactFa: 9.98263888888889, roundedFa: 10 }

    const attempt = (label, payload) => {
      const col = $app.findCollectionByNameOrId('compatibility_analyses')
      const rec = new Record(col)
      rec.set('company', payload.company)
      rec.set('user', payload.user)
      rec.set('consumer_name', payload.consumer_name)
      rec.set('avg_consumption', payload.avg_consumption)
      rec.set('tariff_class', payload.tariff_class)
      rec.set('has_daytime_metering', payload.has_daytime_metering)
      rec.set('daytime_consumption', payload.daytime_consumption)
      rec.set('inputs', payload.inputs)
      rec.set('results', payload.results)
      rec.set('notes', payload.notes)

      const out = { label: label }
      try {
        $app.save(rec)
        out.saved = true
        out.id = rec.id
        try {
          $app.delete(rec)
        } catch (delErr) {
          out.deleteError = delErr.message
        }
      } catch (err) {
        out.saved = false
        out.error = err.message
        try {
          const fieldErrors = {}
          const form = err.response && typeof err.response === 'object' ? err.response : null
          if (form) {
            for (const k in form) {
              fieldErrors[k] = Array.isArray(form[k]) ? form[k].join('; ') : String(form[k])
            }
          }
          out.fieldErrors = fieldErrors
        } catch (_) {}
      }
      return out
    }

    results.exact = attempt('exact_frontend_payload', exactPayload)
    results.no_daytime = attempt('no_daytime_metering', noDaytimePayload)

    let userInfo = null
    try {
      const u = $app.findRecordById('users', 'zq25lvsi5advu3x')
      userInfo = {
        id: u.id,
        company: u.getString('company'),
        role: u.getString('role'),
        active: u.getBool('active'),
        email: u.getString('email'),
      }
    } catch (err) {
      userInfo = { error: err.message }
    }

    return e.json(200, { debug: true, results: results, user: userInfo })
  }
}

routerAdd('POST', '/backend/v1/debug/compatibility-create', makeHandler())
routerAdd('GET', '/backend/v1/debug/compatibility-create', makeHandler())
