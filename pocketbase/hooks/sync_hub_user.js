routerAdd('POST', '/backend/v1/sync-hub-user', (e) => {
  const authHeader = e.request.header.get('Authorization') || ''
  const secret = $secrets.get('ELEKTRA_HUB')
  if (!secret || authHeader !== 'Bearer ' + secret) {
    return e.unauthorizedError('Invalid or missing secret')
  }

  const body = e.requestInfo().body
  if (!body || !body.email || !body.company_name || !body.role) {
    return e.badRequestError('Missing email, company_name, or role')
  }

  let companyRecord
  try {
    companyRecord = $app.findFirstRecordByData('companies', 'name', body.company_name)
  } catch (_) {
    const compCol = $app.findCollectionByNameOrId('companies')
    companyRecord = new Record(compCol)
    companyRecord.set('name', body.company_name)
    $app.save(companyRecord)
  }

  let userRecord
  try {
    userRecord = $app.findAuthRecordByEmail('_pb_users_auth_', body.email)
    if (body.name) userRecord.set('name', body.name)
    userRecord.set('company', companyRecord.id)
    userRecord.set('role', body.role)
    $app.save(userRecord)
  } catch (_) {
    const usersCol = $app.findCollectionByNameOrId('_pb_users_auth_')
    userRecord = new Record(usersCol)
    userRecord.setEmail(body.email)
    userRecord.setPassword($security.randomString(15) + 'aA1!')
    userRecord.setVerified(true)
    if (body.name) userRecord.set('name', body.name)
    userRecord.set('company', companyRecord.id)
    userRecord.set('role', body.role)
    $app.save(userRecord)
  }

  return e.json(200, { success: true, userId: userRecord.id, companyId: companyRecord.id })
})
