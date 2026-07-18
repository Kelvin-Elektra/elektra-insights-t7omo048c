migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('hsp_data')
    col.listRule = ''
    col.viewRule = ''
    app.save(col)

    const count = app.countRecords('hsp_data')
    if (count > 0) return

    const monthKeys = [
      'jan',
      'feb',
      'mar',
      'apr',
      'may',
      'jun',
      'jul',
      'aug',
      'sep',
      'oct',
      'nov',
      'dec',
    ]
    const seed = [
      ['PR', 'Curitiba', 4.81, 5.12, 4.95, 4.6, 4.05, 3.65, 3.3, 3.55, 4.2, 4.65, 5.1, 5.35, 5.4],
      ['PR', 'Londrina', 5.2, 5.4, 5.35, 5.1, 4.7, 4.3, 4.0, 4.25, 4.8, 5.2, 5.5, 5.65, 5.7],
      ['PR', 'Maringa', 5.1, 5.3, 5.25, 5.0, 4.6, 4.2, 3.9, 4.15, 4.7, 5.1, 5.4, 5.55, 5.6],
      ['PR', 'Ponta Grossa', 4.9, 5.15, 5.0, 4.7, 4.15, 3.75, 3.4, 3.65, 4.3, 4.75, 5.2, 5.45, 5.5],
      ['PR', 'Cascavel', 5.3, 5.5, 5.45, 5.2, 4.8, 4.4, 4.1, 4.35, 4.9, 5.3, 5.6, 5.75, 5.8],
      ['SP', 'Sao Paulo', 4.9, 5.1, 5.05, 4.75, 4.2, 3.8, 3.5, 3.75, 4.4, 4.85, 5.2, 5.35, 5.4],
      ['SP', 'Campinas', 5.1, 5.3, 5.25, 4.95, 4.4, 4.0, 3.7, 3.95, 4.6, 5.05, 5.4, 5.55, 5.6],
      ['SP', 'Santos', 4.7, 5.05, 5.1, 4.8, 4.2, 3.75, 3.45, 3.7, 4.25, 4.6, 4.9, 5.0, 5.1],
      [
        'SP',
        'Ribeirao Preto',
        5.4,
        5.55,
        5.5,
        5.25,
        4.75,
        4.35,
        4.05,
        4.3,
        4.95,
        5.4,
        5.7,
        5.8,
        5.85,
      ],
      [
        'RJ',
        'Rio de Janeiro',
        4.7,
        5.15,
        5.3,
        4.95,
        4.35,
        3.85,
        3.55,
        3.75,
        4.3,
        4.6,
        4.8,
        4.9,
        5.1,
      ],
      ['RJ', 'Niteroi', 4.65, 5.1, 5.25, 4.9, 4.3, 3.8, 3.5, 3.7, 4.25, 4.55, 4.75, 4.85, 5.05],
      [
        'MG',
        'Belo Horizonte',
        5.3,
        5.45,
        5.4,
        5.15,
        4.65,
        4.25,
        3.95,
        4.2,
        4.85,
        5.3,
        5.6,
        5.7,
        5.75,
      ],
      ['MG', 'Uberlandia', 5.5, 5.6, 5.55, 5.35, 4.9, 4.5, 4.2, 4.45, 5.1, 5.5, 5.75, 5.85, 5.9],
      [
        'RS',
        'Porto Alegre',
        4.6,
        5.2,
        4.9,
        4.45,
        3.85,
        3.3,
        2.95,
        3.15,
        3.85,
        4.4,
        4.95,
        5.35,
        5.55,
      ],
      [
        'RS',
        'Caxias do Sul',
        4.4,
        5.0,
        4.7,
        4.25,
        3.65,
        3.1,
        2.75,
        2.95,
        3.65,
        4.2,
        4.75,
        5.15,
        5.35,
      ],
      [
        'SC',
        'Florianopolis',
        4.5,
        5.05,
        4.85,
        4.45,
        3.9,
        3.35,
        3.05,
        3.25,
        3.9,
        4.35,
        4.8,
        5.15,
        5.35,
      ],
      ['SC', 'Joinville', 4.4, 4.95, 4.75, 4.35, 3.8, 3.25, 2.95, 3.15, 3.8, 4.25, 4.7, 5.05, 5.25],
      ['SC', 'Chapeco', 4.3, 4.9, 4.65, 4.2, 3.6, 3.05, 2.7, 2.9, 3.6, 4.15, 4.65, 5.0, 5.2],
      ['GO', 'Goiania', 5.6, 5.55, 5.55, 5.45, 5.1, 4.75, 4.45, 4.75, 5.4, 5.75, 5.9, 5.9, 5.85],
      ['MT', 'Cuiaba', 5.8, 5.55, 5.65, 5.7, 5.55, 5.25, 5.05, 5.35, 6.05, 6.3, 6.35, 6.05, 5.8],
      ['MS', 'Campo Grande', 5.5, 5.5, 5.5, 5.4, 5.0, 4.6, 4.3, 4.6, 5.25, 5.65, 5.85, 5.85, 5.8],
      ['BA', 'Salvador', 5.4, 5.75, 5.85, 5.65, 5.1, 4.65, 4.45, 4.55, 5.05, 5.4, 5.55, 5.65, 5.75],
      ['PE', 'Recife', 5.6, 5.95, 6.05, 5.8, 5.25, 4.8, 4.55, 4.6, 5.2, 5.65, 5.9, 6.0, 6.1],
      ['CE', 'Fortaleza', 5.7, 5.85, 5.8, 5.6, 5.3, 5.05, 4.95, 5.2, 5.95, 6.4, 6.45, 6.2, 5.9],
    ]

    for (const row of seed) {
      const state = row[0]
      const city = row[1]
      const annual = row[2]
      const monthly = row.slice(3)
      try {
        app.findFirstRecordByData('hsp_data', 'city', city)
      } catch (_) {
        const record = new Record(col)
        record.set('state', state)
        record.set('city', city)
        record.set('annual', annual)
        monthKeys.forEach((m, i) => record.set(m, monthly[i]))
        app.save(record)
      }
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('hsp_data')
    col.listRule = "@request.auth.id != ''"
    col.viewRule = "@request.auth.id != ''"
    app.save(col)
  },
)
