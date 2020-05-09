exports.up = function(knex) {
  return knex.schema.createTable('admins',t=>{
    t.increments('id').unsigned().primary();
    t.string("name").notNull();
    t.string("email").unique('email')
    t.string("username").notNull();
    t.string("password").notNull();
    t.json("picture");
    t.text("about")
    t.timestamp("created_at").default(knex.fn.now());
    t.timestamp("updated_at").default(knex.fn.now());
  })
};

exports.down = function(knex) {
  return knex.schema.dropTable("admins")
};
