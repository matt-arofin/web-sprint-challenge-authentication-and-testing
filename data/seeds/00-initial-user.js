
exports.seed = async function(knex) {
  return knex('users')
    .truncate()
    .then(function () {
      return knex('users').insert({ username: 'Placeholder', password: '12345'})
    })  
};
