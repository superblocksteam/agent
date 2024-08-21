function doValidateBearerToken(token) {
  if (!token) {
    return false;
  }

  const parts = token.split(' ');

  if (parts.length !== 2) {
    return false;
  }

  if (parts[0] !== 'Bearer') {
    return false;
  }

  return true;
}

function validateApiKey(req) {
  const apiKey = req.get('x-superblocks-api-key');
  // API key should still be in bearer token format
  return doValidateBearerToken(apiKey);
}

function validateAgentKey(req) {
  return !!req.get('x-superblocks-agent-key');
}

function validateBearerToken(req) {
  const token = req.get('Authorization');
  return doValidateBearerToken(token);
}

function validateJwt(req) {
  const token = req.get('Authorization');
  if (!token) {
    return false;
  }

  const parts = token.split(' ');

  if (parts.length !== 2) {
    return false;
  }

  if (parts[0] !== 'Bearer') {
    return false;
  }

  const jwtRegex = /^([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_-]+)$/;
  return jwtRegex.test(parts[1]);
}

function isWorkflow(api) {
  return api && api.trigger && api.trigger.workflow !== undefined;
}

module.exports = {
  checkAuth: (req, api = null) => {
    if (!req) {
      return false;
    }

    // Workflows should only auth with the API key
    // user JWTs also work, but are typically called from nested APIs
    if (isWorkflow(api)) {
      return validateApiKey(req) || validateJwt(req);
    }

    return validateBearerToken(req) || validateApiKey(req);
  },
  validateAgentKey,
};
