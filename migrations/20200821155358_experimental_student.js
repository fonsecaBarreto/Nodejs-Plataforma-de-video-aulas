
exports.up = function(knex) {
  return knex.schema.table('students', t => {
    t.boolean('experimental').default(false)
    t.integer('gold').default(0)
  })
}

exports.down = function(knex) {
  return knex.schema.table('students', t => {
    t.dropColumn('experimental')
    t.dropColumn('gold')
  })
}

