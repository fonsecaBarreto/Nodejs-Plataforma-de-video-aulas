
exports.up = function(knex) {
  return knex.schema.table("modules",t=>{
    t.json("achievement");
    t.string("video");
    t.integer("access");
    t.integer("views");
    t.integer("votes");

  })
};

exports.down = function(knex) {
  return knex.schema.table("modules",t=>{
    t.dropColumn("achievement");
    t.dropColumn("video");
    t.dropColumn("access");
    t.dropColumn("views");
    t.dropColumn("votes");
  })
};
