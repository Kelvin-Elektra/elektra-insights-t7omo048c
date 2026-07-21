migrate(
  (app) => {
    const companies = app.findCollectionByNameOrId('companies')
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const collection = new Collection({
      name: 'hybrid_analyses',
      type: 'base',
      listRule: '@request.auth.id != "" && company = @request.auth.company',
      viewRule: '@request.auth.id != "" && company = @request.auth.company',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != "" && user = @request.auth.id',
      deleteRule: '@request.auth.id != "" && user = @request.auth.id',
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
          required: true,
          collectionId: users.id,
          maxSelect: 1,
        },
        { name: 'customer_name', type: 'text', required: true },
        {
          name: 'battery_type',
          type: 'select',
          required: true,
          values: ['100Ah', '200Ah'],
          maxSelect: 1,
        },
        { name: 'loads', type: 'json' },
        { name: 'results', type: 'json' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_hybrid_analyses_company ON hybrid_analyses (company)',
        'CREATE INDEX idx_hybrid_analyses_user ON hybrid_analyses (user)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('hybrid_analyses')
    app.delete(collection)
  },
)
