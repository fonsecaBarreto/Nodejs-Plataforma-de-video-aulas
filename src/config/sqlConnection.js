const config = require("../../knexfile.js");
const knex = require("knex")(config);
knex.migrate.latest()
module.exports = knex
