
exports.up = function(knex) {
  return knex.schema.createTable('exercisesreplies',t=>{
    t.increments("id").unsigned().primary();
    t.integer("exercise").notNull().references("id").inTable("exercises");
    t.integer("student").notNull().references("id").inTable("students");
    t.json("answer").notNull();
    t.json("attachment");
    t.json("feedback");
    t.boolean("closed").default(false)
    t.boolean("solved").default(false)
    t.timestamp("created_at").default(knex.fn.now());
    t.timestamp("updated_at").default(knex.fn.now());
  })
};

exports.down = function(knex) {
return knex.schema.dropTable("exercisesreplies")
};
