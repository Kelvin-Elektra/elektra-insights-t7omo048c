// Maintenance & Lifecycle tasks can be triggered as needed via /backend/v1/cleanup-test-data

// Helper implementation executed directly inside route callbacks (inlined to avoid Goja VM pool scoping issues)
routerAdd('POST', '/backend/v1/sync-hub-user', (e) => {
  const authHeader = e.request.header.get('Authorization') || ''
  const secret = $secrets.get('ELEKTRA_HUB')

  if (!secret || authHeader !== 'Bearer ' + secret) {
    return e.unauthorizedError('Invalid or missing secret')
  }

  const body = e.requestInfo().body || {}
  const userPayload = body.user || {}
  const companyPayload = body.company || {}

  // 1. Extração normalizada de identificadores
  const hubUserId = body.hub_user_id || userPayload.hub_user_id || userPayload.id || ''
  const email = (body.email || userPayload.email || '').toString().trim().toLowerCase()
  const isDeleted = body.deleted === true || userPayload.deleted === true

  const companyHubId =
    body.hub_company_id ||
    companyPayload.hub_company_id ||
    userPayload.company_id ||
    userPayload.hub_company_id ||
    companyPayload.id ||
    ''

  const companyName =
    companyPayload.name ||
    userPayload.company_name ||
    body.company_name ||
    (userPayload.name ? `Empresa de ${userPayload.name}` : 'Empresa')

  // 2. Resolução do usuário (ordem obrigatória):
  //    - Chave primária: localizar por hub_user_id
  //    - Fallback: se não encontrar, buscar por email
  //    - Auto-correção: se localizar por email e hub_user_id estiver vazio ou diferente, atualizar
  let userRecord = null

  if (hubUserId) {
    try {
      userRecord = $app.findFirstRecordByData('users', 'hub_user_id', hubUserId)
    } catch (_) {}
  }

  if (!userRecord && email) {
    try {
      userRecord = $app.findAuthRecordByEmail('users', email)
    } catch (_) {}
  }

  // 3. Caso: Exclusão definitiva (deleted: true)
  if (isDeleted) {
    if (userRecord) {
      try {
        $app.delete(userRecord)
        $app
          .logger()
          .info('HUB User Sync: record deleted', 'userId', userRecord.id, 'hubUserId', hubUserId)
      } catch (err) {
        return e.badRequestError('Failed to delete user: ' + err.message)
      }
    }
    // Idempotência: se o usuário já não existia, responde 2xx normalmente
    return e.json(200, {
      success: true,
      action: 'deleted',
      userId: userRecord ? userRecord.id : null,
      message: 'User deleted or not found (idempotent)',
    })
  }

  // 4. Se não for exclusão, precisamos de identificador válido para continuar
  if (!hubUserId && !email && !companyPayload.status) {
    return e.badRequestError('Missing required user identifiers (hub_user_id or email)')
  }

  // 5. Gestão de Company
  let companyRecord = null
  if (companyHubId) {
    try {
      companyRecord = $app.findFirstRecordByData('companies', 'hub_company_id', companyHubId)
    } catch (_) {
      const compCol = $app.findCollectionByNameOrId('companies')
      companyRecord = new Record(compCol)
      companyRecord.set('hub_company_id', companyHubId)
      companyRecord.set('name', companyName)
      companyRecord.set('status', companyPayload.status || 'active')
    }

    if (companyPayload.name !== undefined && companyPayload.name !== '') {
      companyRecord.set('name', companyPayload.name)
    } else if (userPayload.company_name !== undefined && userPayload.company_name !== '') {
      companyRecord.set('name', userPayload.company_name)
    }

    if (companyPayload.status !== undefined) {
      companyRecord.set('status', companyPayload.status)
    }

    try {
      $app.save(companyRecord)
    } catch (err) {
      return e.badRequestError('Failed to save company: ' + err.message)
    }
  } else if (userRecord && userRecord.getString('company')) {
    try {
      companyRecord = $app.findRecordById('companies', userRecord.getString('company'))
      if (companyPayload.status !== undefined) {
        companyRecord.set('status', companyPayload.status)
        $app.save(companyRecord)
      }
    } catch (_) {}
  }

  // 6. Revogação/Reativação por empresa:
  //    company.status = "inactive" inativa todos os usuários daquela hub_company_id
  //    company.status = "active" reativa todos os usuários daquela hub_company_id
  if (companyPayload.status !== undefined) {
    const isCompanyActive = companyPayload.status === 'active'
    if (companyHubId) {
      try {
        const companyUsers = $app.findRecordsByFilter(
          '_pb_users_auth_',
          'hub_company_id = {:hubCompId}',
          'created',
          10000,
          0,
          { hubCompId: companyHubId },
        )
        for (const u of companyUsers) {
          u.set('active', isCompanyActive)
          $app.save(u)
        }
      } catch (err) {
        $app.logger().error('Failed to cascade company status to users', 'error', err.message)
      }
    } else if (companyRecord) {
      try {
        const companyUsers = $app.findRecordsByFilter(
          '_pb_users_auth_',
          'company = {:compId}',
          'created',
          10000,
          0,
          { compId: companyRecord.id },
        )
        for (const u of companyUsers) {
          u.set('active', isCompanyActive)
          $app.save(u)
        }
      } catch (err) {
        $app.logger().error('Failed to cascade company status by id to users', 'error', err.message)
      }
    }
  }

  // 7. Se o payload não tiver dados de usuário (ex: payload puramente de status de company), encerra aqui com sucesso
  if (!hubUserId && !email) {
    return e.json(200, {
      success: true,
      action: 'company_status_updated',
      companyId: companyRecord ? companyRecord.id : null,
      status: companyPayload.status,
    })
  }

  // 8. Resolução / Criação do usuário
  const usersCol = $app.findCollectionByNameOrId('_pb_users_auth_')
  let isNewUser = false

  if (!userRecord) {
    // Se o payload diz active: false ou é revogação de usuário inexistente: idempotência (responder 2xx)
    if (userPayload.active === false || body.active === false) {
      return e.json(200, {
        success: true,
        action: 'ignored_inactive_nonexistent',
        message: 'User does not exist, inactive payload ignored',
      })
    }

    userRecord = new Record(usersCol)
    isNewUser = true

    if (email) {
      userRecord.setEmail(email)
    } else {
      userRecord.setEmail(`hub_${hubUserId}@placeholder.internal`)
    }

    userRecord.setPassword($security.randomString(15) + 'aA1!')
    userRecord.setVerified(true)
    // Novo usuário criado ativo por padrão, a não ser que user.active tenha vindo false
    userRecord.set('active', userPayload.active !== undefined ? Boolean(userPayload.active) : true)
  } else {
    // Auto-correção: se localizou por email e o hub_user_id local estiver vazio ou diferente
    if (hubUserId && userRecord.getString('hub_user_id') !== hubUserId) {
      userRecord.set('hub_user_id', hubUserId)
    }
    // Atualizar email se veio e for diferente
    if (email && userRecord.getString('email').toLowerCase() !== email) {
      userRecord.setEmail(email)
    }
  }

  // Atualização dos campos de usuário
  if (hubUserId) {
    userRecord.set('hub_user_id', hubUserId)
  }

  if (userPayload.name !== undefined) userRecord.set('name', userPayload.name)
  if (userPayload.phone !== undefined) userRecord.set('phone', userPayload.phone)
  if (userPayload.role !== undefined) userRecord.set('role', userPayload.role)
  if (body.role_company !== undefined) userRecord.set('role_company', body.role_company)
  if (userPayload.role_company !== undefined)
    userRecord.set('role_company', userPayload.role_company)

  // Semântica de user.active:
  // "Não aplicar user.active se não veio no payload. Regra geral: só aplique a mudança do campo que vier explicitamente no payload; ausência do campo = não mexer."
  if (userPayload.active !== undefined) {
    userRecord.set('active', Boolean(userPayload.active))
  } else if (body.active !== undefined) {
    userRecord.set('active', Boolean(body.active))
  }

  const effectiveHubCompanyId =
    companyHubId || (companyRecord ? companyRecord.getString('hub_company_id') : '')
  if (effectiveHubCompanyId) {
    userRecord.set('hub_company_id', effectiveHubCompanyId)
  }

  if (companyRecord) {
    const resolvedCompName =
      companyPayload.name ||
      userPayload.company_name ||
      body.company_name ||
      companyRecord.getString('name') ||
      companyName
    userRecord.set('company_name', resolvedCompName)
    userRecord.set('company_id', companyRecord.id)
    if (userRecord.collection().fields.getByName('company')) {
      userRecord.set('company', companyRecord.id)
    }
  } else if (userPayload.company_name !== undefined) {
    userRecord.set('company_name', userPayload.company_name)
  }

  try {
    $app.save(userRecord)
  } catch (err) {
    return e.badRequestError('Failed to save user: ' + err.message)
  }

  return e.json(200, {
    success: true,
    action: isNewUser ? 'created' : 'updated',
    userId: userRecord.id,
    companyId: companyRecord ? companyRecord.id : null,
    active: userRecord.getBool('active'),
  })
})

// Rota pontual de manutenção e limpeza segura de dados de teste protegida pelo secret ELEKTRA_HUB
routerAdd('POST', '/backend/v1/cleanup-test-data', (e) => {
  const authHeader = e.request.header.get('Authorization') || ''
  const secret = $secrets.get('ELEKTRA_HUB')

  if (!secret || authHeader !== 'Bearer ' + secret) {
    return e.unauthorizedError('Invalid or missing secret')
  }

  const body = e.requestInfo().body || {}
  const targetEmail = (body.target_email || 'kelvin@testeteste.com').toLowerCase().trim()

  const deletedRecords = []

  // 1. Procurar especificamente o usuário de teste indicado (apenas User_employee de teste)
  try {
    const testUser = $app.findAuthRecordByEmail('_pb_users_auth_', targetEmail)
    // Proteção rigorosa: nunca apagar User_elektra ou User_owner através desta rota
    if (testUser.getString('role') === 'User_employee') {
      const uId = testUser.id
      const uEmail = testUser.getString('email')
      $app.delete(testUser)
      deletedRecords.push({ id: uId, email: uEmail, role: 'User_employee' })
    }
  } catch (_) {}

  // 2. Se solicitado especificamente clean_orphans: true, apagar apenas usuários sem hub_user_id que NÃO sejam admin/owner
  if (body.clean_orphans === true) {
    try {
      const orphans = $app.findRecordsByFilter(
        '_pb_users_auth_',
        "hub_user_id = '' && role = 'User_employee'",
        'created',
        1000,
        0,
      )
      for (const o of orphans) {
        const oId = o.id
        const oEmail = o.getString('email')
        $app.delete(o)
        deletedRecords.push({ id: oId, email: oEmail, role: 'User_employee' })
      }
    } catch (_) {}
  }

  return e.json(200, {
    success: true,
    deletedCount: deletedRecords.length,
    deleted: deletedRecords,
  })
})

// Rota alternativa /backend/v1/hub-sync executando a mesma lógica (iniciando uma chamada interna ou duplicando a verificação de rota)
routerAdd('POST', '/backend/v1/hub-sync', (e) => {
  // Re-despacha para a lógica principal mantendo conformidade com as regras de escopo
  const authHeader = e.request.header.get('Authorization') || ''
  const secret = $secrets.get('ELEKTRA_HUB')

  if (!secret || authHeader !== 'Bearer ' + secret) {
    return e.unauthorizedError('Invalid or missing secret')
  }

  const body = e.requestInfo().body || {}
  const userPayload = body.user || {}
  const companyPayload = body.company || {}

  const hubUserId = body.hub_user_id || userPayload.hub_user_id || userPayload.id || ''
  const email = (body.email || userPayload.email || '').toString().trim().toLowerCase()
  const isDeleted = body.deleted === true || userPayload.deleted === true

  const companyHubId =
    body.hub_company_id ||
    companyPayload.hub_company_id ||
    userPayload.company_id ||
    userPayload.hub_company_id ||
    companyPayload.id ||
    ''

  const companyName =
    companyPayload.name ||
    userPayload.company_name ||
    body.company_name ||
    (userPayload.name ? `Empresa de ${userPayload.name}` : 'Empresa')

  let userRecord = null

  if (hubUserId) {
    try {
      userRecord = $app.findFirstRecordByData('users', 'hub_user_id', hubUserId)
    } catch (_) {}
  }

  if (!userRecord && email) {
    try {
      userRecord = $app.findAuthRecordByEmail('users', email)
    } catch (_) {}
  }

  if (isDeleted) {
    if (userRecord) {
      try {
        $app.delete(userRecord)
        $app
          .logger()
          .info('HUB User Sync: record deleted', 'userId', userRecord.id, 'hubUserId', hubUserId)
      } catch (err) {
        return e.badRequestError('Failed to delete user: ' + err.message)
      }
    }
    return e.json(200, {
      success: true,
      action: 'deleted',
      userId: userRecord ? userRecord.id : null,
      message: 'User deleted or not found (idempotent)',
    })
  }

  if (!hubUserId && !email && !companyPayload.status) {
    return e.badRequestError('Missing required user identifiers (hub_user_id or email)')
  }

  let companyRecord = null
  if (companyHubId) {
    try {
      companyRecord = $app.findFirstRecordByData('companies', 'hub_company_id', companyHubId)
    } catch (_) {
      const compCol = $app.findCollectionByNameOrId('companies')
      companyRecord = new Record(compCol)
      companyRecord.set('hub_company_id', companyHubId)
      companyRecord.set('name', companyName)
      companyRecord.set('status', companyPayload.status || 'active')
    }

    if (companyPayload.name !== undefined && companyPayload.name !== '') {
      companyRecord.set('name', companyPayload.name)
    } else if (userPayload.company_name !== undefined && userPayload.company_name !== '') {
      companyRecord.set('name', userPayload.company_name)
    }

    if (companyPayload.status !== undefined) {
      companyRecord.set('status', companyPayload.status)
    }

    try {
      $app.save(companyRecord)
    } catch (err) {
      return e.badRequestError('Failed to save company: ' + err.message)
    }
  } else if (userRecord && userRecord.getString('company')) {
    try {
      companyRecord = $app.findRecordById('companies', userRecord.getString('company'))
      if (companyPayload.status !== undefined) {
        companyRecord.set('status', companyPayload.status)
        $app.save(companyRecord)
      }
    } catch (_) {}
  }

  if (companyPayload.status !== undefined) {
    const isCompanyActive = companyPayload.status === 'active'
    if (companyHubId) {
      try {
        const companyUsers = $app.findRecordsByFilter(
          '_pb_users_auth_',
          'hub_company_id = {:hubCompId}',
          'created',
          10000,
          0,
          { hubCompId: companyHubId },
        )
        for (const u of companyUsers) {
          u.set('active', isCompanyActive)
          $app.save(u)
        }
      } catch (err) {
        $app.logger().error('Failed to cascade company status to users', 'error', err.message)
      }
    } else if (companyRecord) {
      try {
        const companyUsers = $app.findRecordsByFilter(
          '_pb_users_auth_',
          'company = {:compId}',
          'created',
          10000,
          0,
          { compId: companyRecord.id },
        )
        for (const u of companyUsers) {
          u.set('active', isCompanyActive)
          $app.save(u)
        }
      } catch (err) {
        $app.logger().error('Failed to cascade company status by id to users', 'error', err.message)
      }
    }
  }

  if (!hubUserId && !email) {
    return e.json(200, {
      success: true,
      action: 'company_status_updated',
      companyId: companyRecord ? companyRecord.id : null,
      status: companyPayload.status,
    })
  }

  const usersCol = $app.findCollectionByNameOrId('_pb_users_auth_')
  let isNewUser = false

  if (!userRecord) {
    if (userPayload.active === false || body.active === false) {
      return e.json(200, {
        success: true,
        action: 'ignored_inactive_nonexistent',
        message: 'User does not exist, inactive payload ignored',
      })
    }

    userRecord = new Record(usersCol)
    isNewUser = true

    if (email) {
      userRecord.setEmail(email)
    } else {
      userRecord.setEmail(`hub_${hubUserId}@placeholder.internal`)
    }

    userRecord.setPassword($security.randomString(15) + 'aA1!')
    userRecord.setVerified(true)
    userRecord.set('active', userPayload.active !== undefined ? Boolean(userPayload.active) : true)
  } else {
    if (hubUserId && userRecord.getString('hub_user_id') !== hubUserId) {
      userRecord.set('hub_user_id', hubUserId)
    }
    if (email && userRecord.getString('email').toLowerCase() !== email) {
      userRecord.setEmail(email)
    }
  }

  if (hubUserId) {
    userRecord.set('hub_user_id', hubUserId)
  }

  if (userPayload.name !== undefined) userRecord.set('name', userPayload.name)
  if (userPayload.phone !== undefined) userRecord.set('phone', userPayload.phone)
  if (userPayload.role !== undefined) userRecord.set('role', userPayload.role)
  if (body.role_company !== undefined) userRecord.set('role_company', body.role_company)
  if (userPayload.role_company !== undefined)
    userRecord.set('role_company', userPayload.role_company)

  if (userPayload.active !== undefined) {
    userRecord.set('active', Boolean(userPayload.active))
  } else if (body.active !== undefined) {
    userRecord.set('active', Boolean(body.active))
  }

  const effectiveHubCompanyId =
    companyHubId || (companyRecord ? companyRecord.getString('hub_company_id') : '')
  if (effectiveHubCompanyId) {
    userRecord.set('hub_company_id', effectiveHubCompanyId)
  }

  if (companyRecord) {
    const resolvedCompName =
      companyPayload.name ||
      userPayload.company_name ||
      body.company_name ||
      companyRecord.getString('name') ||
      companyName
    userRecord.set('company_name', resolvedCompName)
    userRecord.set('company_id', companyRecord.id)
    if (userRecord.collection().fields.getByName('company')) {
      userRecord.set('company', companyRecord.id)
    }
  } else if (userPayload.company_name !== undefined) {
    userRecord.set('company_name', userPayload.company_name)
  }

  try {
    $app.save(userRecord)
  } catch (err) {
    return e.badRequestError('Failed to save user: ' + err.message)
  }

  return e.json(200, {
    success: true,
    action: isNewUser ? 'created' : 'updated',
    userId: userRecord.id,
    companyId: companyRecord ? companyRecord.id : null,
    active: userRecord.getBool('active'),
  })
})
