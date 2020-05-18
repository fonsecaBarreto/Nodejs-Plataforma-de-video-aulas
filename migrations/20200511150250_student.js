
exports.up = function(knex) {
  return knex.schema.createTable('students',t=>{
    t.increments('id').unsigned().primary();
    t.string("name").notNull()
    t.string("email").unique().notNull();
    t.json("picture")
    t.string("password").notNull();
    t.integer("points").default(0);
    t.text("notes").default("")
    t.timestamp("created_at").default(knex.fn.now());
    t.timestamp("updated_at").default(knex.fn.now());
  })
};

exports.down = function(knex) {
  return knex.schema.dropTable("students")
};
