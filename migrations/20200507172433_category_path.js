
exports.up = function(knex) {
  return knex.schema.table("categories",t=>{
    t.string("path")
  })
};

exports.down = function(knex) {
  return knex.schema.table("categories",t=>{
    t.dropColumn("categories")
  })
};
