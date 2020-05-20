
exports.up = function(knex) {
  return knex.schema.table("students",t=>{
    t.integer("level").default(0)
    t.string("path").notNull().default(knex.fn.now())
  })
};

exports.down = function(knex) {
  return knex.schema.table("students",t=>{
    t.dropColumn("level")
    t.dropColumn("path")
  })
};
