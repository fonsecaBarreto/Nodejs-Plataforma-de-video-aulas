
exports.up = function(knex) {
  return knex.schema.table("modules",t=>{
    t.integer('notation')
  })
};

exports.down = function(knex) {
  return knex.schema.table("modules",t=>{
    t.dropColumn('notation');
  })
};
