
exports.up = function(knex) {
  return knex.schema.createTable("exercises",t=>{
    t.increments("id").unsigned().primary();
    t.string("enunciation").notNull();
    t.integer("type").notNull();
    t.json("feedback").notNull();
    t.json("options");
  })
};

exports.down = function(knex) {
  return knex.schema.dropTable("exercises");
};
