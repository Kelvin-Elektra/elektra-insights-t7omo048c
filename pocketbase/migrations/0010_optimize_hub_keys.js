migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    if (!users.fields.getByName('company')) {
      const companies = app.findCollectionByNameOrId('companies')
      users.fields.add(
        new RelationField({ name: 'company', collectionId: companies.id, maxSelect: 1 }),
      )
    }

    const usersList = app.findRecordsByFilter(
      '_pb_users_auth_',
      "hub_user_id != ''",
      'created',
      10000,
      0,
    )
    const seenUserIds = {}
    for (const u of usersList) {
      const hubId = u.getString('hub_user_id')
      if (seenUserIds[hubId]) {
        app.delete(u)
      } else {
        seenUserIds[hubId] = true
      }
    }

    let uIndexes = users.indexes || []
    users.indexes = uIndexes.filter((idx) => !idx.includes('hub_user_id'))
    users.addIndex('idx_users_hub_user_id_uniq', true, 'hub_user_id', "hub_user_id != ''")
    app.save(users)

    const companies = app.findCollectionByNameOrId('companies')

    const companiesList = app.findRecordsByFilter(
      'companies',
      "hub_company_id != ''",
      'created',
      10000,
      0,
    )
    const seenCompIds = {}
    for (const c of companiesList) {
      const hubId = c.getString('hub_company_id')
      if (seenCompIds[hubId]) {
        app.delete(c)
      } else {
        seenCompIds[hubId] = true
      }
    }

    let cIndexes = companies.indexes || []
    companies.indexes = cIndexes.filter((idx) => !idx.includes('hub_company_id'))
    companies.addIndex(
      'idx_companies_hub_company_id_uniq',
      true,
      'hub_company_id',
      "hub_company_id != ''",
    )
    app.save(companies)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.removeIndex('idx_users_hub_user_id_uniq')
    app.save(users)

    const companies = app.findCollectionByNameOrId('companies')
    companies.removeIndex('idx_companies_hub_company_id_uniq')
    app.save(companies)
  },
)
