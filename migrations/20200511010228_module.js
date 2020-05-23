
exports.up = function(knex) {
  return knex.schema.createTable("modules",t=>{
    t.increments("id").unsigned().primary();
    t.string("name").notNull();
    t.text("description").notNull();
    t.integer("parentId").references("id").inTable("modules")
    t.string("path").notNull().default("");
    t.json("picture")
    t.timestamp("created_at").default(knex.fn.now());
    t.timestamp("updated_at").default(knex.fn.now());
  })
};

exports.down = function(knex) {
  return knex.schema.dropTable('modules');
};
