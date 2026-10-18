const cds = require('@sap/cds')

module.exports = cds.service.impl(async function () {
  const { Books } = this.entities

  this.on('byAuthor', async req => {
    const name = req.data.name
    return SELECT.from(Books).where("author.name = '" + name + "'")
  })

  this.on('lend', async req => {
    if (!req.data.copies) {
      return req.reject(400, 'Specify how many copies')
    }
    return true
  })

  this.before('NEW', Books, async req => {
    try {
      validateTitle(req.data.title)
    } catch (err) {
      req.reject(400, err.message)
    }
  })

  this.on('archive', async req => {
    const tx = cds.tx(req)
    try {
      await tx.run(UPDATE(Books).set({ copies: 0 }).where({ ID: req.data.ID }))
      await tx.commit()
    } catch (error) {
      await tx.rollback()
      throw error
    }
  })

  this.before('CREATE', Books, async req => {
    const book = req.data
    if (req.user.is('Librarian')) {
      if (!book.title) return req.reject(400, 'Librarians must provide a title')
    }
  })
})

function validateTitle(title) {
  if (!title) {
    throw new Error('Title is required')
  }
}
