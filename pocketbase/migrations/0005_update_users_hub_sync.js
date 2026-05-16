migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    users.fields.removeByName('is_owner')
    users.fields.removeByName('hub_company_id')
    users.fields.removeByName('hub_user_id')

    if (!users.fields.getByName('company_id')) {
      users.fields.add(new TextField({ name: 'company_id' }))
    }
    if (!users.fields.getByName('role_company')) {
      users.fields.add(new TextField({ name: 'role_company' }))
    }

    const roleField = users.fields.getByName('role')
    if (roleField) {
      roleField.values = ['User_owner', 'User_employee']
    }

    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    if (!users.fields.getByName('is_owner')) {
      users.fields.add(new TextField({ name: 'is_owner' }))
    }
    if (!users.fields.getByName('hub_company_id')) {
      users.fields.add(new TextField({ name: 'hub_company_id' }))
    }
    if (!users.fields.getByName('hub_user_id')) {
      users.fields.add(new TextField({ name: 'hub_user_id' }))
    }

    users.fields.removeByName('company_id')
    users.fields.removeByName('role_company')

    const roleField = users.fields.getByName('role')
    if (roleField) {
      roleField.values = ['owner', 'employee']
    }

    app.save(users)
  },
)
