
exports.up = function(knex) {
    return knex.schema.table("posts",t=>{
      t.text("content").notNull().alter()
    })
};  

exports.down = function(knex) {
  return knex.schema.table("posts",t=>{
    t.string("content").alter()
  })
};
