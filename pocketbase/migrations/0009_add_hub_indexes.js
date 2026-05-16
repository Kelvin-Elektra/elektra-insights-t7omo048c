migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.addIndex('idx_users_hub_user_id', true, 'hub_user_id', "hub_user_id != ''")
    users.addIndex('idx_users_hub_company_id', false, 'hub_company_id', '')
    app.save(users)

    const companies = app.findCollectionByNameOrId('companies')
    companies.addIndex(
      'idx_companies_hub_company_id',
      true,
      'hub_company_id',
      "hub_company_id != ''",
    )
    app.save(companies)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.removeIndex('idx_users_hub_user_id')
    users.removeIndex('idx_users_hub_company_id')
    app.save(users)

    const companies = app.findCollectionByNameOrId('companies')
    companies.removeIndex('idx_companies_hub_company_id')
    app.save(companies)
  },
)
