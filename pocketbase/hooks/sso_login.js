routerAdd('GET', '/backend/v1/sso', (e) => {
  const token = e.requestInfo().query['sso_token']
  if (!token) return e.badRequestError('Missing sso_token')

  const secret = $secrets.get('SSO_SECRET')
  if (!secret) return e.internalServerError('SSO configured incorrectly')

  let payload
  try {
    payload = $security.parseJWT(token, secret)
    $app.logger().info('Token Decoding', 'status', 'success', 'payload', payload)
  } catch (err) {
    $app.logger().error('Token Decoding', 'status', 'failed', 'error', err.message)
    return e.unauthorizedError(
      'Token de acesso inválido ou expirado. Por favor, tente novamente através do Hub.',
    )
  }

  const userId = payload.id || payload.sub
  const email = payload.email

  if (!userId && !email) {
    return e.badRequestError('Nenhum identificador encontrado no token')
  }

  // 1. Synchronize Company
  let companyRecord = null
  if (payload.company_id) {
    try {
      companyRecord = $app.findFirstRecordByData('companies', 'hub_company_id', payload.company_id)
      $app.logger().info('Company Lookup', 'status', 'found', 'companyId', companyRecord.id)

      // Update company name if changed
      if (companyRecord.getString('name') !== payload.company_name) {
        companyRecord.set('name', payload.company_name || 'Empresa Sem Nome')
        $app.saveNoValidate(companyRecord)
      }
    } catch (_) {
      $app.logger().info('Company Lookup', 'status', 'not_found', 'action', 'creating_new')
      // Create new company if it doesn't exist
      try {
        const companiesCol = $app.findCollectionByNameOrId('companies')
        companyRecord = new Record(companiesCol)
        companyRecord.set('name', payload.company_name || 'Empresa Sem Nome')
        companyRecord.set('hub_company_id', payload.company_id)
        companyRecord.set('status', 'active')
        $app.saveNoValidate(companyRecord)
      } catch (createErr) {
        $app.logger().error('Erro ao criar empresa', 'error', createErr.message)
      }
    }
  } else {
    $app.logger().info('Company Lookup', 'status', 'skipped', 'reason', 'no_company_id_in_token')
  }

  // 2. Synchronize User
  let userRecord = null
  if (userId) {
    try {
      userRecord = $app.findFirstRecordByData('users', 'hub_user_id', userId)
      $app.logger().info('User Lookup', 'status', 'found_by_hub_id', 'userId', userRecord.id)
    } catch (_) {}
  }

  if (!userRecord && email) {
    try {
      userRecord = $app.findAuthRecordByEmail('users', email)
      $app.logger().info('User Lookup', 'status', 'found_by_email', 'userId', userRecord.id)
    } catch (_) {}
  }

  const usersCol = $app.findCollectionByNameOrId('users')

  if (userRecord) {
    $app.logger().info('User Upsert', 'action', 'updating_existing', 'userId', userRecord.id)
    // Upsert User (Update existing)
    userRecord.set('name', payload.name || userRecord.getString('name'))
    userRecord.set('phone', payload.phone || userRecord.getString('phone'))
    if (email) userRecord.setEmail(email)
    userRecord.set('role', payload.role || userRecord.getString('role'))
    userRecord.set('role_company', payload.role_company || userRecord.getString('role_company'))
    if (userId) userRecord.set('hub_user_id', userId)
    if (payload.company_id) userRecord.set('hub_company_id', payload.company_id)
    if (companyRecord) userRecord.set('company', companyRecord.id)

    try {
      $app.saveNoValidate(userRecord)
    } catch (updateErr) {
      $app.logger().error('Erro ao atualizar usuário', 'error', updateErr.message)
      return e.internalServerError('Falha ao atualizar conta de usuário.')
    }
  } else {
    $app.logger().info('User Upsert', 'action', 'creating_new')
    // Upsert User (Create new)
    userRecord = new Record(usersCol)
    if (email) {
      userRecord.setEmail(email)
    } else {
      userRecord.setEmail(`temp_${$security.randomString(8)}@example.com`)
    }

    userRecord.setPassword($security.randomString(15) + 'A1!') // Ensure password constraints are met
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
    } catch (createErr) {
      $app.logger().error('Erro ao criar usuário', 'error', createErr.message)
      return e.internalServerError('Falha ao criar conta de usuário.')
    }
  }

  if (!userRecord || !userRecord.id) {
    $app
      .logger()
      .error('Final Response Generation', 'status', 'failed', 'reason', 'userRecord_is_null')
    return e.internalServerError('Não foi possível resolver o usuário.')
  }

  try {
    const fetchedRecord = $app.findRecordById('users', userRecord.id)
    $app.logger().info('Final Response Generation', 'status', 'success', 'userId', fetchedRecord.id)
    return $apis.recordAuthResponse($app, e, fetchedRecord)
  } catch (err) {
    $app
      .logger()
      .error(
        'Final Response Generation',
        'status',
        'failed',
        'reason',
        'fetch_failed',
        'error',
        err.message,
      )
    return e.internalServerError('Erro ao gerar sessão de usuário.')
  }
})
