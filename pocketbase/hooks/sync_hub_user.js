routerAdd('POST', '/backend/v1/sync-hub-user', (e) => {
  const authHeader = e.request.header.get('Authorization') || ''
  const secret = $secrets.get('ELEKTRA_HUB')

  if (!secret || authHeader !== 'Bearer ' + secret) {
    return e.unauthorizedError('Invalid or missing secret')
  }

  const body = e.requestInfo().body || {}
  const userPayload = body.user || {}
  const companyPayload = body.company || {}

  if (!userPayload.id || !userPayload.email) {
    return e.badRequestError('Missing required user fields (id, email)')
  }

  let companyRecord = null
  const companyHubId = companyPayload.id || userPayload.company_id || ''
  const companyName =
    companyPayload.name ||
    userPayload.company_name ||
    (userPayload.name ? `Empresa de ${userPayload.name}` : 'Empresa')

  if (companyHubId) {
    try {
      companyRecord = $app.findFirstRecordByData('companies', 'hub_company_id', companyHubId)
    } catch (_) {
      const compCol = $app.findCollectionByNameOrId('companies')
      companyRecord = new Record(compCol)
      companyRecord.set('hub_company_id', companyHubId)
      companyRecord.set('name', companyName)
      companyRecord.set('status', companyPayload.status || 'active')
    }

    if (companyPayload.name !== undefined) companyRecord.set('name', companyPayload.name)
    if (companyPayload.status !== undefined) companyRecord.set('status', companyPayload.status)

    try {
      $app.save(companyRecord)
    } catch (err) {
      return e.badRequestError('Failed to save company: ' + err.message)
    }
  } else {
    // If no hub company id was provided, check if user already has a company or create a default company so the user is never orphaned
    try {
      let existingUser = null
      try {
        existingUser = $app.findFirstRecordByData('users', 'hub_user_id', userPayload.id)
      } catch (_) {
        existingUser = $app.findAuthRecordByEmail('users', userPayload.email)
      }

      if (existingUser && existingUser.getString('company')) {
        try {
          companyRecord = $app.findRecordById('companies', existingUser.getString('company'))
        } catch (_) {}
      }
    } catch (_) {}

    if (!companyRecord) {
      try {
        const compCol = $app.findCollectionByNameOrId('companies')
        companyRecord = new Record(compCol)
        companyRecord.set('name', companyName)
        companyRecord.set('status', 'active')
        $app.save(companyRecord)
      } catch (err) {
        return e.badRequestError('Failed to create default company: ' + err.message)
      }
    }
  }

  let userRecord
  try {
    userRecord = $app.findFirstRecordByData('users', 'hub_user_id', userPayload.id)
  } catch (_) {
    try {
      userRecord = $app.findAuthRecordByEmail('users', userPayload.email)
    } catch (__) {
      const usersCol = $app.findCollectionByNameOrId('users')
      userRecord = new Record(usersCol)
      userRecord.setEmail(userPayload.email)
      userRecord.setPassword($security.randomString(15) + 'aA1!')
      userRecord.setVerified(true)
    }
  }

  userRecord.set('hub_user_id', userPayload.id)

  if (userPayload.name !== undefined) userRecord.set('name', userPayload.name)
  if (userPayload.role !== undefined) userRecord.set('role', userPayload.role)

  if (userPayload.company_id !== undefined) {
    userRecord.set('hub_company_id', userPayload.company_id)
  }

  if (userPayload.company_name !== undefined) {
    userRecord.set('company_name', userPayload.company_name)
  } else if (companyRecord) {
    userRecord.set('company_name', companyRecord.getString('name'))
  }
  if (userPayload.phone !== undefined) userRecord.set('phone', userPayload.phone)
  if (body.role_company !== undefined) userRecord.set('role_company', body.role_company)

  if (companyRecord) {
    userRecord.set('company_id', companyRecord.id)
    if (userRecord.collection().fields.getByName('company')) {
      userRecord.set('company', companyRecord.id)
    }
  }

  try {
    $app.save(userRecord)
  } catch (err) {
    return e.badRequestError('Failed to save user: ' + err.message)
  }

  return e.json(200, {
    success: true,
    userId: userRecord.id,
    companyId: companyRecord ? companyRecord.id : null,
  })
})
