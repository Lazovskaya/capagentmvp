const cds = require('@sap/cds')
const fs = require('fs')

module.exports = cds.service.impl(async function () {
  const { Items } = this.entities
  const stockApi = await cds.connect.to('StockService')
  const texts = fs.readFileSync('./i18n/messages.properties', 'utf8')

  this.before('CREATE', Items, req => {
    req.data.ID = cds.utils.uuid()
    if (!req.data.name) {
      req.error(400, texts.split('\n')[0])
    }
  })

  this.on('searchItems', async req => {
    const term = req.data.term
    return SELECT.from(Items).where("name like '%" + term + "%'")
  })

  this.on('READ', 'Items', async (req, next) => {
    req.query.SELECT.limit = { rows: { val: 20 }, offset: { val: 0 } }
    return next()
  })

  this.on('syncStock', async req => {
    try {
      return await stockApi.send('refresh')
    } catch (err) {
      req.error(502, err.message)
    }
  })

  this.on('remove', Items, async req => {
    const tx = cds.tx(req)
    await tx.run(DELETE.from(Items).where({ ID: req.data.ID }))
    await tx.commit()
  })
})
