/**
 * Routes for GET /api/v3/applications/:id/code (FetchApiCode / API 2.0 code delivery).
 * Used by ExecuteV3 FetchCode path - orchestrator fetches esbuild bundle from server.
 */
const { checkAuth } = require('./utils');

module.exports = [
  {
    id: 'fetch-application-code',
    url: '/api/v3/applications/:applicationId/code',
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

            // Return a minimal esbuild-style CommonJS bundle exporting a CompiledApi shape.
            // The orchestrator wraps this and sends to javascriptsdkapi worker via executeApi().
            // Bundle accesses __sb_context.user (a sandbox global set by the wrapper).
            const bundle = 'module.exports={default:{inputSchema:{safeParse:function(v){return{success:true,data:v}}},outputSchema:{safeParse:function(v){return{success:true,data:v}}},run:async function(ctx){return {sdkapi:"ok",from:"fetchcode",user:__sb_context.user};}}};';

            return res.status(200).json({ bundle });
          },
        },
      },
    ],
  },
  {
    id: 'fetch-application-code-by-branch',
    url: '/api/v3/applications/:applicationId/branches/:branchName/code',
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

            const bundle = `module.exports={default:{inputSchema:{safeParse:function(v){return{success:true,data:v}}},outputSchema:{safeParse:function(v){return{success:true,data:v}}},run:async function(ctx){return {sdkapi:"ok",from:"fetchcode",branch:${JSON.stringify(req.params.branchName)},user:__sb_context.user};}}};`;

            return res.status(200).json({ bundle });
          },
        },
      },
    ],
  },
];
