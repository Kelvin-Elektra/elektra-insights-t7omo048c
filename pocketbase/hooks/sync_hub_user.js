routerAdd('POST', '/backend/v1/sync-hub-user', (e) => {
  const authHeader = e.request.header.get('Authorization') || ''
  const secret = $secrets.get('ELEKTRA_HUB')

  if (!secret || authHeader !== 'Bearer ' + secret) {
    return e.unauthorizedError('Invalid or missing secret')
  }

  const body = e.requestInfo().body || {}
  const userPayload = body.user || {}
  const companyPayload = body.company || {}
  const roleCompany = body.role_company || ''

  if (!userPayload.id || !userPayload.email || !userPayload.role) {
    return e.badRequestError('Missing required user fields (id, email, role)')
  }

  let companyRecord = null
  if (companyPayload.id) {
    try {
      companyRecord = $app.findRecordById('companies', companyPayload.id)
    } catch (_) {
      try {
        companyRecord = $app.findFirstRecordByData('companies', 'hub_company_id', companyPayload.id)
      } catch (__) {
        const compCol = $app.findCollectionByNameOrId('companies')
        companyRecord = new Record(compCol)
        try {
          companyRecord.setId(companyPayload.id)
        } catch (err) {}
      }
    }
    companyRecord.set('name', companyPayload.name || companyRecord.getString('name'))
    if (companyPayload.status) {
      companyRecord.set('status', companyPayload.status)
    }
    $app.save(companyRecord)
  }

  let userRecord
  try {
    userRecord = $app.findRecordById('_pb_users_auth_', userPayload.id)
  } catch (_) {
    try {
      userRecord = $app.findAuthRecordByEmail('_pb_users_auth_', userPayload.email)
    } catch (__) {
      const usersCol = $app.findCollectionByNameOrId('_pb_users_auth_')
      userRecord = new Record(usersCol)
      try {
        userRecord.setId(userPayload.id)
      } catch (err) {}
      userRecord.setEmail(userPayload.email)
      userRecord.setPassword($security.randomString(15) + 'aA1!')
      userRecord.setVerified(true)
    }
  }

  if (userPayload.name) userRecord.set('name', userPayload.name)
  userRecord.set('role', userPayload.role)
  if (userPayload.phone) userRecord.set('phone', userPayload.phone)
  if (userPayload.company_name) userRecord.set('company_name', userPayload.company_name)
  if (userPayload.company_id) userRecord.set('company_id', userPayload.company_id)

  userRecord.set('role_company', roleCompany)

  if (companyRecord) {
    userRecord.set('company', companyRecord.id)
  }

  $app.save(userRecord)

  return e.json(200, {
    success: true,
    userId: userRecord.id,
    companyId: companyRecord ? companyRecord.id : null,
  })
})
