migrate(
  (app) => {
    const collection = new Collection({
      name: 'companies',
      type: 'base',
      listRule: "@request.auth.id != '' && @request.auth.company = id",
      viewRule: "@request.auth.id != '' && @request.auth.company = id",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('companies')
    app.delete(collection)
  },
)
