
exports.up = function(knex) {
  return knex.schema.table("admins",t=>{
    t.timestamp("updated_at").default(knex.fn.now())
  })
};

exports.down = function(knex) {
  return knex.schema.table("admins",t=>{
    t.dropColumn("updated_at");
  })
};
