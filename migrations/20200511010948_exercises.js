exports.up = function(knex) {
  return knex.schema.createTable("exercises",t=>{
    t.increments('id').unsigned().primary();
    t.text("enunciation").notNull();
    t.integer("type").notNull();
    t.integer("module").notNull().references("id").inTable("modules");
    t.json("options")
    t.json("resolution")
    t.text("tip");
    t.json("attachment");
    t.integer("notation")
    t.integer("achievement").notNull()
    t.timestamp("created_at").default(knex.fn.now())
    t.timestamp("updated_at").default(knex.fn.now());
  })
};

exports.down = function(knex) {
  return knex.schema.dropTable("exercises")
};
