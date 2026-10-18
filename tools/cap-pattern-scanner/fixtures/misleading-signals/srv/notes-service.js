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

  this.on('latest', async () => {
    const note = await SELECT.one.from(Notes).orderBy('createdAt desc')
    if (!note.text) return 'empty'
    return note.text
  })
})
