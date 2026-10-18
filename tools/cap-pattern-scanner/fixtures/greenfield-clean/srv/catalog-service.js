const cds = require('@sap/cds')

module.exports = class CatalogService extends cds.ApplicationService {
  async init() {
    const { Items } = this.entities
    const stockApi = await cds.connect.to('StockService')

    this.on('searchItems', async req => {
      const { term } = req.data
      return SELECT.from(Items).where`name like ${`%${term}%`}`
    })

    this.after('READ', Items, async items => {
      try {
        await stockApi.send('refresh', { count: items.length })
      } catch (error) {
        cds.log('catalog').error('Stock refresh failed', error.code)
        throw new Error('STOCK_UNAVAILABLE')
      }
    })

    return super.init()
  }
}
