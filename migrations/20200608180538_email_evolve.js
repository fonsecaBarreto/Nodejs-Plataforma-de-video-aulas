
exports.up = function(knex) {
  return knex.schema.table("email-signature",t=>{
    t.string("name")
    t.string("phone")
  })
};

exports.down = function(knex) {
  return knex.schema.table("email-signature",t=>{
    t.dropColumn('name');
    t.dropColumn('phone');
  })
};
