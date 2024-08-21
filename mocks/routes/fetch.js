const apiDefinitions = require('../fixtures/apis');
const integration = require('../fixtures/integration');
const integrations = require('../fixtures/integrations');
const scheduleJobDefinitions = require('../fixtures/schedule-job');
const { checkAuth, validateAgentKey } = require('./utils');

module.exports = [
  {
    id: 'fetch',
    url: '/api/v3/apis/:id',
    method: 'GET',
    variants: [
      {
        id: 'id',
        type: 'middleware',
        options: {
          middleware: (req, res) => {
            const data = apiDefinitions.find((definition) => definition.api.metadata.id === req.params.id);
            if (!checkAuth(req, data.api)) {
              return res.sendStatus(401);
            }

            if (!data) {
              return res.sendStatus(404);
            }

            // We need a consistent signature for the injected metadata.
            if (req.headers['x-superblocks-agent-id']) {
              req.headers['x-superblocks-agent-id'] = '018b9575-f5f9-7215-ba8f-3376c3f24cf9';
            }

            delete req.headers.traceparent;
            delete req.headers['x-superblocks-authorization'];

            // NOTE(frank): We set a custom user agent so reverting to default one to pass signature verification.
            req.headers['user-agent'] = 'Go-http-client/1.1';

            if (req.headers.host) {
              req.headers.host = 'host';
            }

            const metadata = data.api.metadata.tags && data.api.metadata.tags.inject === 'true' ? [{
              name: 'INJECTED_FETCH_METADATA',
              step: {
                javascript: {
                  body: `return { query: ${JSON.stringify(req.query)}, headers: ${JSON.stringify(req.headers)} }`,
                },
              },
            }] : [];

            // NOTE(frank): I might have an unecessary extra nesting layer.
            return res.status(200).json({ ...data, ...{ api: { ...data.api, ...{ blocks: metadata.concat(data.api.blocks) } } } });
          },
        },
      },
    ],
  },
  {
    id: 'fetch-per-branch',
    url: '/api/v3/apis/:id/branches/:branch',
    method: 'GET',
    variants: [
      {
        id: 'id-and-branch',
        type: 'middleware',
        options: {
          middleware: (req, res) => {
            const data = apiDefinitions.find((definition) => definition.api.metadata.id === req.params.id && definition.api.metadata.branch === req.params.branch);
            if (!checkAuth(req, data.api)) {
              return res.sendStatus(401);
            }

            if (!data) {
              return res.sendStatus(404);
            }

            const metadata = data.api.metadata.tags && data.api.metadata.tags.inject === 'true' ? [{
              name: 'INJECTED_FETCH_METADATA',
              step: {
                javascript: {
                  body: `return { query: ${JSON.stringify(req.query)}, headers: ${JSON.stringify(req.headers)} }`,
                },
              },
            }] : [];

            return res.status(200).json({ ...data, ...{ api: { ...data.api, ...{ blocks: metadata.concat(data.api.blocks) } } } });
          },
        },
      },
    ],
  },
  {
    id: 'fetch-job',
    url: '/api/v2/agents/pending-jobs',
    method: 'POST',
    variants: [
      {
        id: 'default',
        type: 'middleware',
        options: {
          middleware: (req, res) => {
            const data = scheduleJobDefinitions;
            return res.status(200).json({ apis: data });
          },
        },
      },
    ],
  },
  {
    id: 'fetch-integration-configurations',
    url: '/api/v1/integrations/:id',
    method: 'GET',
    variants: [
      {
        id: 'id',
        type: 'middleware',
        options: {
          middleware: (req, res) => {
            if (!checkAuth(req)) {
              return res.sendStatus(401);
            }

            const data = apiDefinitions.find((definition) => definition.api.metadata.id === req.params.id);

            if (!data) {
              return res.sendStatus(500);
            }

            return res.status(200).json(data.realResponse);
          },

        },
      },
    ],
  },
  {
    id: 'fetch-integration',
    url: '/api/v1/agents/datasource/:id',
    method: 'POST',
    variants: [
      {
        id: 'id',
        type: 'middleware',
        options: {
          middleware: (req, res) => {
            if (!checkAuth(req)) {
              return res.sendStatus(401);
            }

            const data = integration.find((i) => i.data.datasource.id === req.params.id);

            if (!data) {
              return res.sendStatus(404);
            }

            return res.status(200).json(data);
          },

        },
      },
    ],
  },
  {
    id: 'fetch-user-token',
    url: '/api/v1/agents/user/userToken',
    method: 'GET',
    variants: [
      {
        id: 'default',
        type: 'middleware',
        options: {
          middleware: (req, res) => {
            if (!checkAuth(req)) {
              return res.sendStatus(401);
            }

            const a = req.body.authType;
            const { tokenType } = req.body;
            if (tokenType === 'id-token') {
              return res.status(200).json({ data: 'some-id-token-that-should-be-a-jwt' });
            }
            if (a.includes('oauth')) {
              return res.status(200).json({ data: 'asdf' });
            }

            return res.status(200).json({ data: '' });
          },
        },
      },
    ],
  },
  {
    id: 'cache-user-token',
    url: '/api/v1/agents/user/userToken',
    method: 'POST',
    variants: [
      {
        id: 'default',
        type: 'middleware',
        options: {
          middleware: (req, res) => {
            if (!checkAuth(req)) {
              return res.sendStatus(401);
            }
            return res.sendStatus(200);
          },
        },
      },
    ],
  },
  {
    id: 'delete-user-tokens',
    url: '/api/v1/agents/user/userToken',
    method: 'DELETE',
    variants: [
      {
        id: 'default',
        type: 'middleware',
        options: {
          middleware: (req, res) => {
            if (!checkAuth(req)) {
              return res.sendStatus(401);
            }
            return res.sendStatus(200);
          },
        },
      },
    ],
  },
  {
    id: 'fetch-integrations',
    url: '/api/v1/integrations',
    method: 'GET',
    variants: [
      {
        id: 'default',
        type: 'middleware',
        options: {
          middleware: (req, res) => {
            if (!checkAuth(req)) {
              return res.sendStatus(401);
            }

            const profile = req.query.profile || 'default';

            // eslint-disable-next-line no-nested-ternary
            const ids = req.query.slug ? [req.query.slug] : Array.isArray(req.query.id) ? req.query.id : [req.query.id]; // NOTE(frank): This is not what the server should do.
            const data = [];
            const pool = req.query.kind ? integrations[req.query.kind] : { ...integrations.PLUGIN, ...integrations.SECRET };

            if (ids.filter((x) => x).length === 0) {
              Object.entries(pool).forEach(([k, v]) => {
                if (profile in v) {
                  data.push({
                    id: k, slug: k, organizationId: '00000000-0000-0000-0000-000000000001', configurations: [{ id: v[profile].configuration_id, configuration: v[profile] }],
                  });
                }
              });

              return res.status(200).json({ data });
            }

            // eslint-disable-next-line no-restricted-syntax
            for (const id of ids) {
              if (id in pool && profile in pool[id]) {
                data.push({ id, slug: id, configurations: [{ configuration: pool[id][profile] }] });
              } else {
                return res.sendStatus(404);
              }
            }

            return res.status(200).json({ data });
          },
        },
      },
    ],
  },
  {
    id: 'patch-apis',
    url: '/api/v3/apis',
    method: 'PATCH',
    variants: [
      {
        id: 'default',
        type: 'middleware',
        options: {
          middleware: (req, res) => {
            if (!validateAgentKey(req)) {
              return res.sendStatus(401);
            }

            return res.status(202).json({});
          },
        },
      },
    ],
  },
];
