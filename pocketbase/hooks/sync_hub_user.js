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
  if (companyPayload.id) {
    try {
      companyRecord = $app.findRecordById('companies', companyPayload.id)
    } catch (_) {
      const compCol = $app.findCollectionByNameOrId('companies')
      companyRecord = new Record(compCol)
      companyRecord.setId(companyPayload.id)
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
      userRecord.setId(userPayload.id)
      userRecord.setEmail(userPayload.email)
      userRecord.setPassword($security.randomString(15) + 'aA1!')
      userRecord.setVerified(true)
    }
  }

  if (userPayload.name) userRecord.set('name', userPayload.name)
  if (userPayload.role) userRecord.set('role', userPayload.role)
  if (userPayload.company_id) userRecord.set('company_id', userPayload.company_id)
  if (userPayload.role_company) userRecord.set('role_company', userPayload.role_company)

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
