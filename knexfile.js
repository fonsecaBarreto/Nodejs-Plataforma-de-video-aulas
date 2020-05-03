// Update with your config settings.

module.exports = {
    client: 'postgresql',
    connection: {
      database: 'mlinsdatabase',
      user:     'mlinsadmin',
      password: '123465'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
};
