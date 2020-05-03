
exports.up = function(knex) {
  return knex.schema.createTable("posts",t=>{
    t.increments('id').unsigned().primary();
    t.string("title").notNull();
    t.text("description").notNull();
    t.text('content').notNull();
    t.string("keys").notNull();
    t.json("picture");
    t.json("galery");
    t.integer("views").default(0);
    t.integer("votes").default(0);
    t.string("path").notNull().default("");
    t.json("attachments");
    t.integer("author").references('id').inTable("admins");
    t.json('responses');
    t.date('publication_date').notNull().default(knex.fn.now())
    t.integer("category").references('id').inTable("categories");
    t.timestamp("created_at").default(knex.fn.now())
  })

};

exports.down = function(knex) {
  return knex.schema.dropTable("posts")
};
