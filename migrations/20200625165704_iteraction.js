
exports.up = function(knex) {
  return knex.schema.createTable("interactions",t=>{
    t.increments('id').unsigned().primary()
    t.text("content").notNull();
    t.integer("parentId").references("id").inTable("interactions")
    t.integer("student").references('id').inTable("students").notNull();
    t.integer("module").references('id').inTable("modules")
    t.integer("votes").default(0);
    t.integer("views").default(0);
    t.string("path").notNull()
    t.timestamp("created_at").default(knex.fn.now());
    t.timestamp("updated_at").default(knex.fn.now());
    t.json("votesregisters");
  })
};

exports.down = function(knex) {
  return knex.schema.dropTable("interactions")
};
