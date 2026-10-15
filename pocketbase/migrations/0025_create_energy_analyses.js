migrate(
  (app) => {
    const companies = app.findCollectionByNameOrId('companies')
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const collection = new Collection({
      name: 'energy_analyses',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (company = @request.auth.company || @request.auth.role = 'User_elektra')",
      viewRule:
        "@request.auth.id != '' && (company = @request.auth.company || @request.auth.role = 'User_elektra')",
      createRule: "@request.auth.id != '' && company = @request.auth.company",
      updateRule: "@request.auth.id != '' && company = @request.auth.company",
      deleteRule: "@request.auth.id != '' && company = @request.auth.company",
      fields: [
        {
          name: 'company',
          type: 'relation',
          required: true,
          collectionId: companies.id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'user',
          type: 'relation',
          required: false,
          collectionId: users.id,
          maxSelect: 1,
        },
        { name: 'consumer_name', type: 'text' },
        { name: 'uc_number', type: 'text' },
        { name: 'city_name', type: 'text' },
        { name: 'state', type: 'text' },
        { name: 'kit_power', type: 'number' },
        { name: 'expected_avg_generation', type: 'number' },
        { name: 'mode', type: 'text' }, // 'efficiency' | 'declared'
        { name: 'inputs', type: 'json' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_energy_analyses_company ON energy_analyses (company)',
        'CREATE INDEX idx_energy_analyses_user ON energy_analyses (user)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('energy_analyses')
    app.delete(collection)
  },
)
