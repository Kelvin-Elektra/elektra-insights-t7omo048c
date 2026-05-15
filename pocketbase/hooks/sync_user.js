routerAdd('POST', '/backend/v1/sync-user', (e) => {
  const body = e.requestInfo().body
  if (!body || !body.email || !body.company_id || !body.role) {
    return e.badRequestError('Missing email, company_id, or role')
  }

  let userRecord
  try {
    userRecord = $app.findAuthRecordByEmail('_pb_users_auth_', body.email)
    if (body.name) userRecord.set('name', body.name)
    userRecord.set('company', body.company_id)
    userRecord.set('role', body.role)
    $app.save(userRecord)
  } catch (_) {
    const usersCol = $app.findCollectionByNameOrId('_pb_users_auth_')
    userRecord = new Record(usersCol)
    userRecord.setEmail(body.email)
    // Gen random pass for synced user
    userRecord.setPassword($security.randomString(15) + 'aA1!')
    userRecord.setVerified(true)
    if (body.name) userRecord.set('name', body.name)
    userRecord.set('company', body.company_id)
    userRecord.set('role', body.role)
    $app.save(userRecord)
  }

  return e.json(200, { success: true, userId: userRecord.id })
})
