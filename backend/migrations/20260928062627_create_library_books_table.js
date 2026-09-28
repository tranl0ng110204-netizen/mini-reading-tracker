export const up = function(knex) {
  return knex.schema.createTable('library_books', table => {
    table.increments('id').primary();
    table.string('work_id', 100).unique().notNullable();
    table.string('title', 255).notNullable();
    table.string('authors', 255);
    table.string('cover_id', 50);
    table.integer('publish_year');
    table.integer('total_pages').notNullable().defaultTo(0);
    table.text('subjects');
    table.enum('status', ['WANT_TO_READ', 'READING', 'READ']).notNullable().defaultTo('WANT_TO_READ');
    table.integer('current_page').notNullable().defaultTo(0);
    table.integer('rating').nullable(); // 1-5
    table.text('note').nullable();
    table.datetime('started_at').nullable();
    table.datetime('completed_at').nullable();
    table.timestamps(true, true); // created_at, updated_at
  });
};

export const down = function(knex) {
  return knex.schema.dropTableIfExists('library_books');
};
