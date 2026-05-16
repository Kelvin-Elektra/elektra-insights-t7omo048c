migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    if (!users.fields.getByName('company')) {
      const companies = app.findCollectionByNameOrId('companies')
      users.fields.add(
        new RelationField({ name: 'company', collectionId: companies.id, maxSelect: 1 }),
      )
    }

    app
      .db()
      .newQuery(`
    DELETE FROM _pb_users_auth_ WHERE id NOT IN (
      SELECT MIN(id) FROM _pb_users_auth_ GROUP BY hub_user_id
    ) AND hub_user_id IS NOT NULL AND hub_user_id != ''
  `)
      .execute()

    let uIndexes = users.indexes || []
    users.indexes = uIndexes.filter((idx) => !idx.includes('hub_user_id'))
    users.addIndex('idx_users_hub_user_id_uniq', true, 'hub_user_id', "hub_user_id != ''")
    app.save(users)

    const companies = app.findCollectionByNameOrId('companies')

    app
      .db()
      .newQuery(`
    DELETE FROM companies WHERE id NOT IN (
      SELECT MIN(id) FROM companies GROUP BY hub_company_id
    ) AND hub_company_id IS NOT NULL AND hub_company_id != ''
  `)
      .execute()

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
