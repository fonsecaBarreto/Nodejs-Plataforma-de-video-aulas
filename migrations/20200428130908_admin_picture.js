
exports.up = function(knex) {
  return knex.schema.table("admins",t=>{
    t.json("picture");
    t.text("about")
  })
};

exports.down = function(knex) {
  return knex.schema.table("admins",t=>{
    t.dropColumn("picture"),
    t.dropColumn("about")
  })
};
