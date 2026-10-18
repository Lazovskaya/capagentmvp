const cds = require('@sap/cds')

module.exports = cds.service.impl(async function () {
  this.before('CREATE', 'Items', req => {
    const item = req.data
    if (!item.code) return req.reject(400, 'Item code is required')
  })

  this.on('moveStock', req => {
    const { sku } = req.data
    if (!sku) return req.reject(400, 'SKU is required')
    return sku
  })
})
