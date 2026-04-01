"use strict";
var sdkApi = require("@superblocksteam/sdk-api");
var { z } = require("zod");

// ---- Inlined module: transform-utils ----
function mapRows(rows, transform) {
  if (!Array.isArray(rows)) return [];
  return rows.map(function(row, index) {
    try { return transform(row, index); } catch (e) {
      return Object.assign({}, row, { __error: e.message });
    }
  });
}

function groupBy(rows, keyFn) {
  var groups = {};
  for (var i = 0; i < rows.length; i++) {
    var key = keyFn(rows[i]);
    if (!groups[key]) groups[key] = [];
    groups[key].push(rows[i]);
  }
  return groups;
}

// ---- Inlined module: error-handler ----
var ErrorCode = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INTEGRATION_ERROR: "INTEGRATION_ERROR",
  NOT_FOUND: "NOT_FOUND"
};

function createAppError(code, message, details) {
  var err = new Error(message);
  err.code = code;
  err.details = details || {};
  return err;
}

function wrapIntegrationCall(name, fn) {
  return async function() {
    try { return await fn.apply(null, arguments); } catch (e) {
      throw createAppError(ErrorCode.INTEGRATION_ERROR, "Integration '" + name + "' failed: " + e.message, { integration: name });
    }
  };
}

// ---- Input schemas ----
var listOrdersSchema = z.object({
  customerId: z.string(),
  status: z.string().default("all"),
  limit: z.number().default(50),
  offset: z.number().default(0)
});

var createOrderSchema = z.object({
  customerId: z.string(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number(),
    price: z.number()
  })),
  notes: z.string().optional()
});

// ---- Core operations ----
var listOrders = wrapIntegrationCall("postgres-orders", async function(context) {
  var params = listOrdersSchema.parse(context.input);
  var whereClause = "WHERE customer_id = $1";
  var bindings = [params.customerId];

  if (params.status !== "all") {
    whereClause += " AND status = $2";
    bindings.push(params.status);
  }

  var query = "SELECT o.*, json_agg(oi.*) as items FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id " +
    whereClause + " GROUP BY o.id LIMIT " + params.limit + " OFFSET " + params.offset;
  var rows = await context.executeQuery("postgres-orders", { body: query, bindings: bindings });
  var enriched = mapRows(rows, function(row) {
    return Object.assign({}, row, { itemCount: Array.isArray(row.items) ? row.items.length : 0 });
  });
  return { orders: enriched, byStatus: groupBy(enriched, function(r) { return r.status; }), pagination: { limit: params.limit, offset: params.offset } };
});

var createOrder = wrapIntegrationCall("postgres-orders", async function(context) {
  var params = createOrderSchema.parse(context.input);

  var orderResult = await context.executeQuery("postgres-orders", {
    body: "INSERT INTO orders (customer_id, notes, status) VALUES ($1, $2, $3) RETURNING *",
    bindings: [params.customerId, params.notes || "", "pending"]
  });

  var orderId = orderResult[0] ? orderResult[0].id : null;
  if (!orderId) throw createAppError(ErrorCode.INTEGRATION_ERROR, "Failed to create order");

  for (var i = 0; i < params.items.length; i++) {
    var item = params.items[i];
    await context.executeQuery("postgres-orders", {
      body: "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)",
      bindings: [orderId, item.productId, item.quantity, item.price]
    });
  }

  // Cache in Redis
  await context.executeQuery("redis-cache", {
    body: JSON.stringify({ command: "SET", key: "order:" + orderId, value: JSON.stringify(orderResult[0]), ex: 3600 })
  });

  // Send confirmation email
  await context.executeQuery("sendgrid-email", {
    body: JSON.stringify({ to: params.customerId, template: "order-confirmation", data: { orderId: orderId } })
  });

  // Publish event
  await context.executeQuery("kafka-events", {
    body: JSON.stringify({ topic: "order.created", key: orderId, value: JSON.stringify({ orderId: orderId, customerId: params.customerId }) })
  });

  return { order: orderResult[0], itemsInserted: params.items.length };
});

// ---- Exported module ----
module.exports.default = {
  run: async function(context) {
    var action = context.input && context.input.action ? context.input.action : "list";
    try {
      if (action === "list") return await listOrders(context);
      if (action === "create") return await createOrder(context);
      throw createAppError(ErrorCode.VALIDATION_ERROR, "Unknown action: " + action);
    } catch (e) {
      return { error: true, code: e.code || "UNKNOWN_ERROR", message: e.message, details: e.details || {} };
    }
  },
  integrations: [
    { id: "postgres-orders", pluginId: "postgres" },
    { id: "redis-cache", pluginId: "redis" },
    { id: "sendgrid-email", pluginId: "sendgrid" },
    { id: "kafka-events", pluginId: "kafka" },
    { id: "s3-attachments", pluginId: "s3" }
  ]
};
