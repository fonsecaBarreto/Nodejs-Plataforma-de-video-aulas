
exports.up = function(knex) {
  return knex.schema.table("modules",t=>{
    t.json("picture")
  })
};

exports.down = function(knex) {
  return knex.schema.table("modules",t=>{
    t.dropColumn("modules")
  })
};
