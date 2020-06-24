
exports.up = function(knex) {
  return knex.schema.table("modules",t=>{
    t.json("attachment")
  })
};

exports.down = function(knex) {
  return knex.schema.table("modules",t=>{
    t.dropColumn("attachment")
  })
};
