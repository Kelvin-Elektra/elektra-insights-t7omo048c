migrate(
  (app) => {
    // Update all current users to active = 1
    app.db().newQuery('UPDATE users SET active = 1').execute()
  },
  (app) => {
    // no-op
  },
)
