
exports.up = function(knex) {
  return knex.schema.createTable('audiogroups', t => {
    t.increments('id').unsigned().primary();
    t.string("title").notNull();
    t.text("description").notNull();
    t.json("content").notNull()
  })
};

exports.down = function(knex) {
  return knex.schema.dropTable('audiogroups')
};
