
exports.up = function(knex) {
  return knex.schema.createTable("modules",t=>{
    t.increments("id").unsigned().primary();
    t.string("name").notNull();
    t.text("description").notNull();
    t.integer("parentId").references("id").inTable("modules")
    t.timestamp("created_at").default(knex.fn.now())
    t.string("path")
  })
};

exports.down = function(knex) {
  
};
