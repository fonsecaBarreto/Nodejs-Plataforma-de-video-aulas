
exports.up = function(knex) {
  return knex.schema.createTable("posts",t=>{
    t.increments('id').unsigned().primary();
    t.string("title").notNull()
    t.string("description").notNull()
    t.string('content').notNull()
    t.string("keys").notNull()
    t.integer("category").references('id').inTable("categories");
    t.timestamp("created_at").default(knex.fn.now())
  })

};

exports.down = function(knex) {
  return knex.schema.dropTable("posts")
};
