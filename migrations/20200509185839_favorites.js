exports.up = function(knex) {
  return knex.schema.createTable("websiteconfigs",t=>{
    t.string("ref").primary();
    t.json("content").notNull();
  })
};

exports.down = function(knex) {
  return knex.schema.dropTable("websiteconfigs")
};
