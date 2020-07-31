
exports.up = function(knex) {
  return knex.schema.table("modules",t=>{
    t.json('videosource')
  })
};

exports.down = function(knex) {
  return knex.schema.table('modules',t=>{
    t.dropColumn('videosource')
  })
};
