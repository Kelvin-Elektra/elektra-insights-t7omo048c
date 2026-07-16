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
        { name: 'state', type: 'text', required: true },
        { name: 'city', type: 'text', required: true },
        { name: 'hsp_value', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_hsp_data_state_city ON hsp_data (state, city)'],
    })
    app.save(collection)

    const seedData = [
      { state: 'PR', city: 'Curitiba', hsp_value: 4812 },
      { state: 'PR', city: 'Londrina', hsp_value: 5200 },
      { state: 'PR', city: 'Maringa', hsp_value: 5100 },
      { state: 'PR', city: 'Ponta Grossa', hsp_value: 4900 },
      { state: 'PR', city: 'Cascavel', hsp_value: 5300 },
      { state: 'SP', city: 'Sao Paulo', hsp_value: 4900 },
      { state: 'SP', city: 'Campinas', hsp_value: 5100 },
      { state: 'SP', city: 'Santos', hsp_value: 4700 },
      { state: 'SP', city: 'Ribeirao Preto', hsp_value: 5400 },
      { state: 'RJ', city: 'Rio de Janeiro', hsp_value: 4700 },
      { state: 'RJ', city: 'Niteroi', hsp_value: 4650 },
      { state: 'MG', city: 'Belo Horizonte', hsp_value: 5300 },
      { state: 'MG', city: 'Uberlandia', hsp_value: 5500 },
      { state: 'RS', city: 'Porto Alegre', hsp_value: 4600 },
      { state: 'RS', city: 'Caxias do Sul', hsp_value: 4400 },
      { state: 'SC', city: 'Florianopolis', hsp_value: 4500 },
      { state: 'SC', city: 'Joinville', hsp_value: 4400 },
      { state: 'SC', city: 'Chapeco', hsp_value: 4300 },
      { state: 'GO', city: 'Goiania', hsp_value: 5600 },
      { state: 'MT', city: 'Cuiaba', hsp_value: 5800 },
      { state: 'MS', city: 'Campo Grande', hsp_value: 5500 },
      { state: 'BA', city: 'Salvador', hsp_value: 5400 },
      { state: 'PE', city: 'Recife', hsp_value: 5600 },
      { state: 'CE', city: 'Fortaleza', hsp_value: 5700 },
    ]

    for (const sd of seedData) {
      try {
        app.findFirstRecordByData('hsp_data', 'city', sd.city)
      } catch (_) {
        const record = new Record(collection)
        record.set('state', sd.state)
        record.set('city', sd.city)
        record.set('hsp_value', sd.hsp_value)
        app.save(record)
      }
    }
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('hsp_data')
    app.delete(collection)
  },
)
