exports.up = function(knex) {
  return knex.schema.createTable("websiteconfigs",t=>{
    t.string("ref").primary();
    t.json("content").notNull();
    t.timestamp("created_at").default(knex.fn.now())
    t.timestamp("updated_at").default(knex.fn.now());
  })
};

exports.down = function(knex) {
  return knex.schema.dropTable("websiteconfigs")
};
