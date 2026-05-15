routerAdd('POST', '/backend/v1/sso-login', (e) => {
  const body = e.requestInfo().body
  const token = body.token
  if (!token) return e.badRequestError('Missing token')

  const secret = $secrets.get('SSO_SECRET')
  if (!secret) return e.internalServerError('SSO configured incorrectly')

  let payload
  try {
    payload = $security.parseJWT(token, secret)
  } catch (err) {
    return e.unauthorizedError('Invalid or expired token')
  }

  const email = payload.email
  if (!email) return e.badRequestError('Token missing email')

  try {
    const userRecord = $app.findAuthRecordByEmail('_pb_users_auth_', email)
    return $apis.recordAuthResponse($app, e, userRecord)
  } catch (_) {
    return e.notFoundError('User not found in this hub')
  }
})
