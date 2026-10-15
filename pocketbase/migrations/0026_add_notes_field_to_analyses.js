migrate(
  (app) => {
    const collections = ['energy_analyses', 'efficiency_analyses', 'hybrid_analyses', 'uc_analyses']
    for (const name of collections) {
      try {
        const col = app.findCollectionByNameOrId(name)
        if (!col.fields.getByName('notes')) {
          col.fields.add(
            new TextField({
              name: 'notes',
              required: false,
            }),
          )
          app.save(col)
        }
      } catch (e) {
        console.log(`Failed to add notes field to ${name}:`, e)
      }
    }
  },
  (app) => {
    const collections = ['energy_analyses', 'efficiency_analyses', 'hybrid_analyses', 'uc_analyses']
    for (const name of collections) {
      try {
        const col = app.findCollectionByNameOrId(name)
        const field = col.fields.getByName('notes')
        if (field) {
          col.fields.removeByName('notes')
          app.save(col)
        }
      } catch (e) {
        console.log(`Failed to remove notes field from ${name}:`, e)
      }
    }
  },
)
