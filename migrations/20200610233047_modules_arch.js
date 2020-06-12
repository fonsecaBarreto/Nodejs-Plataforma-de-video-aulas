
exports.up = function(knex) {
  return knex.schema.table("modules",t=>{
    t.boolean('archived').default(false)
    t.string('restriction').default('all')
  })
};

exports.down = function(knex) {
  return knex.schema.table("modules",t=>{
    t.dropColumn("archived");
    t.dropColumn("restriction");
  })
};
