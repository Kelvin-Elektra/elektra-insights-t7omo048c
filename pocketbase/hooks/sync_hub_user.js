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
      companyRecord = $app.findFirstRecordByData('companies', 'hub_company_id', companyPayload.id)
    } catch (_) {
      const compCol = $app.findCollectionByNameOrId('companies')
      companyRecord = new Record(compCol)
      companyRecord.set('hub_company_id', companyPayload.id)
    }

    if (companyPayload.name !== undefined) companyRecord.set('name', companyPayload.name)
    if (companyPayload.status !== undefined) companyRecord.set('status', companyPayload.status)

    try {
      $app.save(companyRecord)
    } catch (err) {
      return e.badRequestError('Failed to save company: ' + err.message)
    }
  }

  let userRecord
  try {
    userRecord = $app.findFirstRecordByData('_pb_users_auth_', 'hub_user_id', userPayload.id)
  } catch (_) {
    try {
      userRecord = $app.findAuthRecordByEmail('_pb_users_auth_', userPayload.email)
    } catch (__) {
      const usersCol = $app.findCollectionByNameOrId('_pb_users_auth_')
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
  }
  if (userPayload.phone !== undefined) userRecord.set('phone', userPayload.phone)
  if (body.role_company !== undefined) userRecord.set('role_company', body.role_company)

  if (companyRecord) {
    userRecord.set('company_id', companyRecord.id)
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
