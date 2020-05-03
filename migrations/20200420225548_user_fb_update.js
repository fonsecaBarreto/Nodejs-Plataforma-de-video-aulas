
exports.up = function(knex) {
  return knex.schema.table("users",t=>{
    t.string("fb").alter()
  })
};

exports.down = function(knex) {
  return knex.schema.table("users",t=>{
    t.dropColumn("fb")
  })
};
