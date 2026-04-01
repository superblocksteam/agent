"use strict";
var sdkApi = require("@superblocksteam/sdk-api");
var { z } = require("zod");

// Input validation
var userSchema = z.object({
  name: z.string(),
  email: z.string()
});

// CRUD operations
async function getUsers(context) {
  var limit = (context.input && context.input.limit) || 10;
  var offset = (context.input && context.input.offset) || 0;

  var result = await context.executeQuery("postgres-1", {
    body: "SELECT * FROM users LIMIT " + limit + " OFFSET " + offset
  });

  return { users: result, pagination: { limit: limit, offset: offset } };
}

async function createUser(context) {
  var parsed = userSchema.parse(context.input);
  var result = await context.executeQuery("postgres-1", {
    body: "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *",
    bindings: [parsed.name, parsed.email]
  });

  // Send notification
  await context.executeQuery("slack-1", {
    body: JSON.stringify({ text: "New user created: " + parsed.name })
  });

  return { user: result };
}

module.exports.default = {
  run: async function(context) {
    if (context.input && context.input.action === "create") {
      return createUser(context);
    }
    return getUsers(context);
  },
  integrations: [
    { id: "postgres-1", pluginId: "postgres" },
    { id: "slack-1", pluginId: "slack" }
  ]
};
