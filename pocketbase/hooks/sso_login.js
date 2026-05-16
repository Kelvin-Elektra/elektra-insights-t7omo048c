routerAdd('GET', '/backend/v1/sso', (e) => {
  const token = e.requestInfo().query['sso_token']
  if (!token) return e.badRequestError('Missing sso_token')

  const secret = $secrets.get('SSO_SECRET')
  if (!secret) return e.internalServerError('SSO configured incorrectly')

  let payload
  try {
    payload = $security.parseJWT(token, secret)
  } catch (err) {
    return e.unauthorizedError('Invalid or expired token')
  }

  const userId = payload.id || payload.sub
  const email = payload.email

  if (!userId && !email) {
    return e.badRequestError('No identifier in token')
  }

  let userRecord

  if (userId) {
    try {
      userRecord = $app.findFirstRecordByData('_pb_users_auth_', 'hub_user_id', userId)
    } catch (_) {}
  }

  if (!userRecord && email) {
    try {
      userRecord = $app.findAuthRecordByEmail('_pb_users_auth_', email)
    } catch (_) {}
  }

  if (!userRecord) {
    return e.unauthorizedError('User not found in this hub')
  }

  return $apis.recordAuthResponse($app, e, userRecord)
})
