migrate(
  (app) => {
    const companies = app.findCollectionByNameOrId('companies')
    const collection = new Collection({
      name: 'uc_analyses',
      type: 'base',
      listRule: "@request.auth.id != '' && company = @request.auth.company",
      viewRule: "@request.auth.id != '' && company = @request.auth.company",
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
        { name: 'consumer_name', type: 'text' },
        { name: 'uc_number', type: 'text' },
        { name: 'report_data', type: 'json' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('uc_analyses')
    app.delete(collection)
  },
)
