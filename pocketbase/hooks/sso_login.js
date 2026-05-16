routerAdd('GET', '/backend/v1/sso', (e) => {
  const token = e.requestInfo().query['sso_token']
  if (!token) return e.badRequestError('Missing sso_token')

  const secret = $secrets.get('SSO_SECRET')
  if (!secret) return e.internalServerError('SSO configured incorrectly')

  let payload
  try {
    payload = $security.parseJWT(token, secret)
    $app
      .logger()
      .info('SSO Token Decoding', 'status', 'success', 'userId', payload.id || payload.sub)
  } catch (err) {
    $app.logger().error('SSO Token Decoding', 'status', 'failed', 'error', err.message)
    return e.unauthorizedError(
      'Token de acesso inválido ou expirado. Por favor, tente novamente através do Hub.',
    )
  }

  const userId = payload.id || payload.sub
  const email = payload.email

  if (!userId && !email) {
    return e.badRequestError('Nenhum identificador encontrado no token')
  }

  // 1. Sync Company
  let companyRecord = null
  if (payload.company_id) {
    try {
      companyRecord = $app.findFirstRecordByData('companies', 'hub_company_id', payload.company_id)
      if (companyRecord.getString('name') !== payload.company_name) {
        companyRecord.set('name', payload.company_name || 'Empresa Sem Nome')
        $app.saveNoValidate(companyRecord)
      }
    } catch (_) {
      try {
        const companiesCol = $app.findCollectionByNameOrId('companies')
        companyRecord = new Record(companiesCol)
        companyRecord.set('name', payload.company_name || 'Empresa Sem Nome')
        companyRecord.set('hub_company_id', payload.company_id)
        companyRecord.set('status', 'active')
        $app.saveNoValidate(companyRecord)
        $app.logger().info('SSO Company Sync', 'status', 'created', 'companyId', companyRecord.id)
      } catch (err) {
        $app.logger().error('SSO Company Sync', 'status', 'failed', 'error', err.message)
        return e.internalServerError('failed to sync company data')
      }
    }
  }

  // 2. Sync User
  let userRecord = null
  if (userId) {
    try {
      userRecord = $app.findFirstRecordByData('users', 'hub_user_id', userId)
    } catch (_) {}
  }

  if (!userRecord && email) {
    try {
      userRecord = $app.findAuthRecordByEmail('users', email)
    } catch (_) {}
  }

  const usersCol = $app.findCollectionByNameOrId('users')

  if (userRecord) {
    // Update existing user
    if (email) userRecord.setEmail(email)
    if (payload.name) userRecord.set('name', payload.name)
    if (payload.phone) userRecord.set('phone', payload.phone)
    if (payload.role) userRecord.set('role', payload.role)
    if (payload.role_company) userRecord.set('role_company', payload.role_company)
    if (userId) userRecord.set('hub_user_id', userId)
    if (payload.company_id) userRecord.set('hub_company_id', payload.company_id)
    if (companyRecord) userRecord.set('company', companyRecord.id)

    try {
      $app.saveNoValidate(userRecord)
      $app.logger().info('SSO User Sync', 'status', 'updated', 'userId', userRecord.id)
    } catch (err) {
      $app.logger().error('SSO User Sync', 'status', 'failed_update', 'error', err.message)
      return e.internalServerError('failed to sync user data')
    }
  } else {
    // Create new user
    userRecord = new Record(usersCol)
    if (email) {
      userRecord.setEmail(email)
    } else {
      userRecord.setEmail(`temp_${$security.randomString(8)}@example.com`)
    }

    userRecord.setPassword($security.randomString(15) + 'A1!')
    userRecord.setVerified(true)

    userRecord.set('name', payload.name || '')
    userRecord.set('phone', payload.phone || '')
    userRecord.set('role', payload.role || 'User_employee')
    userRecord.set('role_company', payload.role_company || 'user')
    if (userId) userRecord.set('hub_user_id', userId)
    if (payload.company_id) userRecord.set('hub_company_id', payload.company_id)
    if (companyRecord) userRecord.set('company', companyRecord.id)

    try {
      $app.saveNoValidate(userRecord)
      $app.logger().info('SSO User Sync', 'status', 'created', 'userId', userRecord.id)
    } catch (err) {
      $app.logger().error('SSO User Sync', 'status', 'failed_create', 'error', err.message)
      return e.internalServerError('failed to sync user data')
    }
  }

  let fetchedRecord
  try {
    fetchedRecord = $app.findRecordById('users', userRecord.id)
  } catch (err) {
    $app.logger().error('SSO User Fetch', 'status', 'failed', 'error', err.message)
    return e.internalServerError('failed to fetch user data')
  }

  // 3. Manually generate Auth Token
  // We avoid $apis.recordAuthResponse to prevent nil pointer dereferences
  // when password metadata or internal token auth states are misconfigured.
  const jwtPayload = {
    id: fetchedRecord.id,
    type: 'auth',
    collectionId: usersCol.id,
  }

  const jwtSecret = $secrets.get('SSO_SECRET') || $security.randomString(32)
  const authToken = $security.createJWT(jwtPayload, jwtSecret, 604800) // 7 days duration

  $app.logger().info('SSO Login Success', 'userId', fetchedRecord.id)

  return e.json(200, {
    token: authToken,
    record: fetchedRecord,
  })
})
