
exports.up = function(knex) {
  return knex.schema.table("exercisesreplies",t=>{
    t.boolean("revised").default(false)
  })
};

exports.down = function(knex) {
  return knex.schema.table("exercisesreplies",t=>{
    t.dropColumn("revised")
  })
};
