
exports.up = function(knex) {
  return knex.schema.createTable("editor_choices",t=>{
    t.integer("ref").primary();
    t.string("description").notNull();
    t.json("content").notNull();
  })
};

exports.down = function(knex) {
  return knex.schema.dropTable("editor_choices")
};
