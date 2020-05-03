
exports.up = function(knex) {
  return knex.schema.createTable('users',t=>{
    t.increments('id').unsigned().primary();
    t.string("name").notNull()
    t.string('email').notNull();
    t.string("password").notNull();
    t.json("profile").notNull();
    t.timestamp("created_at").default(knex.fn.now())
  })
};

exports.down = function(knex) {
  return knex.schema.dropTable("users")
};
