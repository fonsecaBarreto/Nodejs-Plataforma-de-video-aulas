
exports.up = function(knex) {
  return knex.schema.table("exercises",t=>{
    t.integer("notation")
  })
};

exports.down = function(knex) {
  return knex.schema.table("exercises",t=>{
    t.dropColumn("notation")
  })
};
