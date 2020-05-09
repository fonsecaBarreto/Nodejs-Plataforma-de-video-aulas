
exports.up = function(knex) {
  return knex.schema.createTable('users',t=>{
    t.increments('id').unsigned().primary();
    t.string("name").notNull()
    t.string("email");
    t.string("password").notNull();
    t.json("profile").notNull();
    t.string("fb").unsigned()
    t.timestamp("created_at").default(knex.fn.now());
    t.timestamp("updated_at").default(knex.fn.now());
  })
};

exports.down = function(knex) {
  return knex.schema.dropTable("users")
};
