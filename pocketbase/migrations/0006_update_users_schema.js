migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    if (users.fields.getByName('is_owner')) users.fields.removeByName('is_owner')
    if (users.fields.getByName('hub_company_id')) users.fields.removeByName('hub_company_id')
    if (users.fields.getByName('hub_user_id')) users.fields.removeByName('hub_user_id')

    if (!users.fields.getByName('company_id')) {
      users.fields.add(new TextField({ name: 'company_id' }))
    }

    if (!users.fields.getByName('role_company')) {
      users.fields.add(new TextField({ name: 'role_company' }))
    }

    if (users.fields.getByName('role')) {
      users.fields.removeByName('role')
    }

    users.fields.add(
      new SelectField({
        name: 'role',
        values: ['User_owner', 'User_employee'],
        maxSelect: 1,
      }),
    )

    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (users.fields.getByName('company_id')) users.fields.removeByName('company_id')
    if (users.fields.getByName('role_company')) users.fields.removeByName('role_company')
    app.save(users)
  },
)
