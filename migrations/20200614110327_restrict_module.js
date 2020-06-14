
exports.up = function(knex) {
  return knex.schema.table("modules",t=>{
    t.dropColumn("restriction")
    t.json("restrict")
  })
};

exports.down = function(knex) {
  return knex.schema.table("modules",t=>{
      t.dropColumn("restrict")
      t.string("restriction")


  })
};
