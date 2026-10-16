migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    let changed = false
    if (!users.fields.getByName('active')) {
      // BoolField in PocketBase: required should be false so false is permitted
      users.fields.add(new BoolField({ name: 'active', required: false }))
      changed = true
    }

    if (changed) {
      app.save(users)
    }

    // Backfill: set active = true for all existing users if null/empty
    const allUsers = app.findRecordsByFilter('_pb_users_auth_', '', 'created', 10000, 0)
    for (const u of allUsers) {
      // PocketBase getBool returns boolean; default existing users to true (active)
      if (u.get('active') === null || u.get('active') === undefined) {
        u.set('active', true)
        app.save(u)
      }
    }
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (users.fields.getByName('active')) {
      users.fields.removeByName('active')
      app.save(users)
    }
  },
)
