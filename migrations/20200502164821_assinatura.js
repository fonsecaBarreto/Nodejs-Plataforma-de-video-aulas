
exports.up = function(knex) {
  return knex.schema.createTable("email-signature",t=>{
    t.increments('id').unsigned().primary();
    t.string("email").notNull();
    t.timestamp("created_at").default(knex.fn.now())
  })
};

exports.down = function(knex) {
  return knex.schema.dropTable("email-signature")
};
