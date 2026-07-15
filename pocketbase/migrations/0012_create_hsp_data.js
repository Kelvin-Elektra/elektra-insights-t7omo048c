migrate(
  (app) => {
    const collection = new Collection({
      name: 'hsp_data',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'hsp_id', type: 'text' },
        { name: 'city_name', type: 'text', required: true },
        { name: 'state', type: 'text', required: true },
        { name: 'annual', type: 'number' },
        { name: 'jan', type: 'number' },
        { name: 'feb', type: 'number' },
        { name: 'mar', type: 'number' },
        { name: 'apr', type: 'number' },
        { name: 'may', type: 'number' },
        { name: 'jun', type: 'number' },
        { name: 'jul', type: 'number' },
        { name: 'aug', type: 'number' },
        { name: 'sep', type: 'number' },
        { name: 'oct', type: 'number' },
        { name: 'nov', type: 'number' },
        { name: 'dec', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_hsp_data_state ON hsp_data (state)',
        'CREATE INDEX idx_hsp_data_city_state ON hsp_data (city_name, state)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('hsp_data')
    app.delete(collection)
  },
)
