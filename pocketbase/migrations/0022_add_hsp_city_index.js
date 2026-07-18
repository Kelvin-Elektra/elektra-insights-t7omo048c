migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('hsp_data')
    col.addIndex('idx_hsp_data_city', false, 'city', '')
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('hsp_data')
    col.removeIndex('idx_hsp_data_city')
    app.save(col)
  },
)
