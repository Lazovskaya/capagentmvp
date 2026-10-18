const cds = require('@sap/cds')

const STATUS_OPEN = 'OPEN'

module.exports = cds.service.impl(async function () {
  const { Notes } = this.entities

  // Old approach, removed in v2:
  // SELECT.from(Notes).where("text like '%" + term + "%'")

  const documentation = "Never write req.error(err) in handlers; use a message key instead"

  this.on('openNotes', async () => {
    return SELECT.from(Notes).where('status = ' + "'" + STATUS_OPEN + "'")
  })

  this.on('describe', () => documentation)
})
