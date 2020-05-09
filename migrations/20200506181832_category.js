exports.up = function(knex) {
  return knex.schema.createTable("categories",t=>{
    t.increments("id").unsigned().primary();
    t.string("name").notNull();
    t.integer("parentId").references("id").inTable("categories")
    t.timestamp("created_at").default(knex.fn.now())

  })
};

exports.down = function(knex) {
  return knex.schema.dropTable("categories");
};
