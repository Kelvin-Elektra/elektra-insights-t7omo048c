routerAdd('GET', '/backend/v1/sso', (e) => {
  const token = e.requestInfo().query['sso_token']
  if (!token) return e.badRequestError('Missing sso_token')

  const secret = $secrets.get('SSO_SECRET')
  if (!secret) return e.internalServerError('SSO configured incorrectly')

  let payload
  try {
    payload = $security.parseJWT(token, secret)
  } catch (err) {
    return e.unauthorizedError('Token inválido ou expirado')
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

      // Update company name if changed
      if (companyRecord.getString('name') !== payload.company_name) {
        companyRecord.set('name', payload.company_name || 'Empresa Sem Nome')
        $app.saveNoValidate(companyRecord)
      }
    } catch (_) {
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
  }

  // 2. Synchronize User
  let userRecord = null
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

  const usersCol = $app.findCollectionByNameOrId('_pb_users_auth_')

  if (userRecord) {
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
    }
  } else {
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

  return $apis.recordAuthResponse($app, e, userRecord)
})
