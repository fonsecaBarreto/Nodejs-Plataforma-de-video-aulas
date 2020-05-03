
exports.up = function(knex) {
  return knex.schema.table("posts",t=>{
    t.integer("author").references('id').inTable("admins");
    t.date('publication_date').notNull().default(knex.fn.now())
    t.json('responses')
  })
};

exports.down = function(knex) {
  return knex.schema.table("posts",t=>{
    t.dropColumn("author")
    t.dropColumn("publication_date")
    t.dropColumn("responses")
   
  })
};
