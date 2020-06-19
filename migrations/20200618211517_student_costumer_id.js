
exports.up = function(knex) {
  return knex.schema.table("students",t=>{
    t.string("subscription_id")
    t.string("customer_id")
    t.boolean("authorized")
    t.string("expiration")
    t.string("phone")
    t.string("cpfCnpj")
  })
};

exports.down = function(knex) {
  return knex.schema.table("students",t=>{
    t.dropColumn("subscription_id")
    t.dropColumn("customer_id")
    t.dropColumn("authorized")
    t.dropColumn("expiration")
    t.dropColumn("phone")
    t.dropColumn("cpfCnpj")
  })
};
