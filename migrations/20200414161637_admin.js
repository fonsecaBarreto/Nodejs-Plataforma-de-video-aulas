
exports.up = function(knex) {
  return knex.schema.createTable('admins',t=>{
    t.increments('id').unsigned().primary();
    t.string("username").notNull()
    t.string("password").notNull();
    t.timestamp("created_at").default(knex.fn.now())
  })
};

exports.down = function(knex) {
  return knex.schema.dropTable("admins")
};
