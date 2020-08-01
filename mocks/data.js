const faker = require("faker");

module.exports = {
  name: faker.lorem.words(),
  isActive: faker.random.boolean(),
  child: {
    name: faker.lorem.words(),
    isActive: faker.random.boolean(),
  },
  childs: new Array(faker.random.number({ min: 3, max: 10 }))
    .fill(0)
    .map(() => ({
      ...(faker.random.boolean() ? { comments: faker.random.number() } : {}),
      ...(faker.random.boolean()
        ? { comment_count: String(faker.random.number()) }
        : {}),
      name: faker.lorem.words(),
      isActive: faker.random.boolean(),
    })),
};
