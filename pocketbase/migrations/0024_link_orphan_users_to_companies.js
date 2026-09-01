migrate(
  (app) => {
    const users = app.findRecordsByFilter(
      'users',
      "company = '' || company = null",
      'created',
      1000,
      0,
    )
    const companiesCol = app.findCollectionByNameOrId('companies')

    for (const u of users) {
      // Skip elektra admin if wanted, or ensure they also have a company if needed
      let comp = null
      const hubCompId = u.getString('hub_company_id')
      if (hubCompId) {
        try {
          comp = app.findFirstRecordByData('companies', 'hub_company_id', hubCompId)
        } catch (_) {}
      }

      if (!comp && u.getString('company_id')) {
        try {
          comp = app.findRecordById('companies', u.getString('company_id'))
        } catch (_) {}
      }

      if (!comp) {
        const compName =
          u.getString('company_name') ||
          (u.getString('name')
            ? `Empresa de ${u.getString('name')}`
            : `Empresa ${u.getString('email')}`)
        comp = new Record(companiesCol)
        comp.set('name', compName)
        comp.set('status', 'active')
        if (hubCompId) {
          comp.set('hub_company_id', hubCompId)
        }
        app.save(comp)
      }

      u.set('company', comp.id)
      u.set('company_id', comp.id)
      if (!u.getString('company_name')) {
        u.set('company_name', comp.getString('name'))
      }
      app.save(u)
    }
  },
  () => {
    // No reverse needed
  },
)
