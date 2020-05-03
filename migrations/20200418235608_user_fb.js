
exports.up = function(knex) {
  return knex.schema.table("users",t=>{
    t.integer("fb").unsigned()
  })
};

exports.down = function(knex) {
  return kenex.schema.table("users",t=>{
    t.dropColumn("fb")
  })
};
