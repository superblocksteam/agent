"use strict";
var sdkApi = require("@superblocksteam/sdk-api");
module.exports.default = {
  run: async function(context) {
    return { message: "hello from code mode", input: context.input };
  },
  integrations: []
};
