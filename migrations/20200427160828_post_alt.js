
exports.up = function(knex) {
  return knex.schema.table("posts",t=>{
    t.integer("views").default(0),
    t.integer("votes").default(0)
    t.string("path").notNull().default(""),
    t.json("attachments")
  })
};

exports.down = function(knex) {
  return knex.schema.table("posts",t=>{
    t.dropTable("views");
    t.dropTable("votes");
    t.dropTable("path");
  })
};
