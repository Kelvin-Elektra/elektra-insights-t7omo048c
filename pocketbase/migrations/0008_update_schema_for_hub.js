migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    let changed = false

    const fieldsToRemove = ['is_owner', 'hub_company_id', 'hub_user_id']
    fieldsToRemove.forEach((f) => {
      if (users.fields.getByName(f)) {
        users.fields.removeByName(f)
        changed = true
      }
    })

    const roleField = users.fields.getByName('role')
    if (roleField) {
      roleField.values = ['User_owner', 'User_employee']
      changed = true
    } else {
      users.fields.add(
        new SelectField({ name: 'role', values: ['User_owner', 'User_employee'], maxSelect: 1 }),
      )
      changed = true
    }

    if (!users.fields.getByName('company_id')) {
      users.fields.add(new TextField({ name: 'company_id' }))
      changed = true
    }

    if (!users.fields.getByName('role_company')) {
      users.fields.add(new TextField({ name: 'role_company' }))
      changed = true
    }

    if (changed) {
      app.save(users)
    }

    users.addIndex('idx_users_company_id', false, 'company_id', '')
    users.addIndex('idx_users_role_company', false, 'role_company', '')
    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.removeIndex('idx_users_company_id')
    users.removeIndex('idx_users_role_company')
    app.save(users)
  },
)
