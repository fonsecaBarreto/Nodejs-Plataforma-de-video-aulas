
exports.up = function(knex) {
  return knex.schema.table("exercisesreplies",t=>{
    t.integer("achievement")
  })
};

exports.down = function(knex) {
  return knex.schema.table("exercisesreplies",t=>{
    t.dropColumn("achievement")
  })
};
