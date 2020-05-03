
exports.up = function(knex) {
  return knex.schema.table("posts",t=>{
    t.json("picture");
    t.json("galery");
  })
};

exports.down = function(knex) {
  return knex.schema.table("posts",t=>{
    t.dropColumn('picture');
    t.dropColumn("galery")
  })
};
