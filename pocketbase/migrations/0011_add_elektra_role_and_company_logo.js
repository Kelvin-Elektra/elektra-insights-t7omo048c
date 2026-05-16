migrate((app) => {
  const users = app.findCollectionByNameOrId('users')
  const roleField = users.fields.getByName('role')
  if (roleField && roleField.values && !roleField.values.includes('User_elektra')) {
    roleField.values.push('User_elektra')
  }
  app.save(users)

  const companies = app.findCollectionByNameOrId('companies')
  if (!companies.fields.getByName('logo')) {
    companies.fields.add(
      new FileField({
        name: 'logo',
        maxSelect: 1,
        maxSize: 2097152,
        mimeTypes: ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'],
      }),
    )
  }
  companies.listRule =
    "@request.auth.id != '' && (@request.auth.company = id || @request.auth.role = 'User_elektra')"
  companies.viewRule =
    "@request.auth.id != '' && (@request.auth.company = id || @request.auth.role = 'User_elektra')"
  companies.updateRule =
    "@request.auth.id != '' && @request.auth.company = id && (@request.auth.role = 'User_owner' || @request.auth.role_company = 'admin')"
  app.save(companies)

  const analyses = app.findCollectionByNameOrId('uc_analyses')
  analyses.listRule =
    "@request.auth.id != '' && (company = @request.auth.company || @request.auth.role = 'User_elektra')"
  analyses.viewRule =
    "@request.auth.id != '' && (company = @request.auth.company || @request.auth.role = 'User_elektra')"
  app.save(analyses)
})
