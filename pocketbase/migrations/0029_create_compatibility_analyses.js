migrate(
  (app) => {
    const companies = app.findCollectionByNameOrId('companies')
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const collection = new Collection({
      name: 'compatibility_analyses',
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
        { name: 'avg_consumption', type: 'number' },
        { name: 'tariff_class', type: 'text' },
        { name: 'has_daytime_metering', type: 'bool' },
        { name: 'daytime_consumption', type: 'number' },
        { name: 'inputs', type: 'json' },
        { name: 'results', type: 'json' },
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_compatibility_analyses_company ON compatibility_analyses (company)',
        'CREATE INDEX idx_compatibility_analyses_user ON compatibility_analyses (user)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('compatibility_analyses')
    app.delete(collection)
  },
)
