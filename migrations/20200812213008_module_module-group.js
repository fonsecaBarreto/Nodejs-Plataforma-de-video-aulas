
exports.up = function(knex) {
  return knex.schema.table('modules', t => {
    t.json('audiogroup')
  })
};

exports.down = function(knex) {
  return knex.schema.table("modules",t=>{
    t.dropColumn('audiogroup');
  })
};
