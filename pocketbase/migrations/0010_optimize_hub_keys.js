migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    if (!users.fields.getByName('company')) {
      const companies = app.findCollectionByNameOrId('companies')
      users.fields.add(
        new RelationField({ name: 'company', collectionId: companies.id, maxSelect: 1 }),
      )
    }

    users.addIndex('idx_users_hub_user_id_uniq', true, 'hub_user_id', "hub_user_id != ''")
    app.save(users)

    const companies = app.findCollectionByNameOrId('companies')
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
