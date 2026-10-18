const cds = require('@sap/cds')

async function itemsByCode(db, code) {
  return db.run(`SELECT * FROM Items WHERE code = '${code}'`)
}

async function itemsByName(name) {
  const condition = "name = '" + name + "'"
  return SELECT.from('Items').where(condition)
}

async function itemsByStatus(status) {
  return SELECT.from('Items').where('status = '
    + status)
}

module.exports = { itemsByCode, itemsByName, itemsByStatus, cds }
