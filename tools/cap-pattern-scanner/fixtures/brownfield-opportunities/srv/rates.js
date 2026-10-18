const cds = require('@sap/cds')

module.exports = cds.service.impl(async function () {
  this.on('convertPrice', async req => {
    const currency = req.data.currency
    try {
      const product = await SELECT.one.from('Items').where({ ID: req.params[0] })
      if (!product) {
        return req.reject(404, 'Item not found')
      }
      const target = String(currency).toUpperCase()
      const source = 'USD'
      const base = Number(product.price)
      const label = `${product.name} (${source} to ${target})`
      const steps = []
      steps.push('lookup')
      steps.push('validate')
      steps.push('prepare')
      const response = await fetch(`https://rates.example.invalid/latest?from=${source}&to=${target}`)
      if (!response.ok) {
        return req.reject(502, 'Rate service request failed')
      }
      const body = await response.json()
      const rate = body.rates[target]
      if (!rate) {
        return req.reject(404, `Rate ${source} to ${target} not found`)
      }
      steps.push('fetched')
      const converted = base * Number(rate)
      const rounded = Math.round(converted * 100) / 100
      const spread = Math.round(rounded * 2) / 100
      const net = Math.round((rounded - spread) * 100) / 100
      const gross = Math.round((rounded + spread) * 100) / 100
      const midpoint = Math.round(((net + gross) / 2) * 100) / 100
      steps.push('converted')
      const note = `${label}: ${base} = ${midpoint}`
      req.notify(200, note)
      steps.push('notified')
      return { source, target, rate, steps }
    } catch (error) {
      console.error('Rate lookup failed', error)
      return req.reject(500, 'Could not retrieve rate')
    }
  })
})
