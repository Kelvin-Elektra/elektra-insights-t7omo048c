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

  let userRecord
  try {
    if (userId) {
      userRecord = $app.findRecordById('_pb_users_auth_', userId)
    } else if (email) {
      userRecord = $app.findAuthRecordByEmail('_pb_users_auth_', email)
    } else {
      throw new Error('No identifier in token')
    }
    return $apis.recordAuthResponse($app, e, userRecord)
  } catch (_) {
    return e.unauthorizedError('User not found in this hub')
  }
})
