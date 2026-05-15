migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const companies = app.findCollectionByNameOrId('companies')

    users.fields.add(
      new RelationField({
        name: 'company',
        collectionId: companies.id,
        maxSelect: 1,
        cascadeDelete: false,
      }),
    )

    users.fields.add(
      new SelectField({
        name: 'role',
        values: ['owner', 'employee'],
        maxSelect: 1,
      }),
    )

    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.fields.removeByName('company')
    users.fields.removeByName('role')
    app.save(users)
  },
)
