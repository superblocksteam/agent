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

            // Regression target: app id 000...003 executes a real integration query
            // through the FetchCode -> javascriptsdkapi -> integration executor path.
            if (req.params.applicationId === '00000000-0000-0000-0000-000000000003') {
              const bundle = 'module.exports={default:{name:"fetchcode-regression-test",inputSchema:{safeParse:function(v){return{success:true,data:v}}},outputSchema:{safeParse:function(v){return{success:true,data:v}}},integrations:[{key:"db",pluginId:"postgres",id:"my-integration-one"}],run:async function(ctx,input){const query=await ctx.integrations.db.execute("SELECT 1 WHERE $1::int > 0",[input.orderId]);return {sdkapi:"ok",from:"fetchcode-db-query",query:query};}}};';
              return res.status(200).json({ bundle });
            }

            if (req.params.applicationId === '00000000-0000-0000-0000-000000000004') {
              const bundle = 'module.exports={default:{name:"fetchcode-file-upload-test",inputSchema:{safeParse:function(v){return{success:true,data:v}}},outputSchema:{safeParse:function(v){return{success:true,data:v}}},integrations:[],run:async function(ctx,input){const text=await input.SampleFiles.files[0].readContentsAsync("text");return {sdkapi:"ok",from:"fetchcode-file-upload",contents:text};}}};';
              return res.status(200).json({ bundle });
            }

            // Return a minimal esbuild-style CommonJS bundle exporting a CompiledApi shape.
            // The orchestrator wraps this and sends to javascriptsdkapi worker via executeApi().
            // Bundle accesses __sb_context.user (a sandbox global set by the wrapper).
            // Include integrations:[] so sdk-api executeApi doesn't crash on [...api.integrations].
            const bundle = 'module.exports={default:{name:"fetchcode-test",inputSchema:{safeParse:function(v){return{success:true,data:v}}},outputSchema:{safeParse:function(v){return{success:true,data:v}}},integrations:[],run:async function(ctx,input){return {sdkapi:"ok",from:"fetchcode",user:ctx.user};}}};';

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

            const bundle = `module.exports={default:{name:"fetchcode-test",inputSchema:{safeParse:function(v){return{success:true,data:v}}},outputSchema:{safeParse:function(v){return{success:true,data:v}}},integrations:[],run:async function(ctx,input){return {sdkapi:"ok",from:"fetchcode",branch:${JSON.stringify(req.params.branchName)},user:ctx.user};}}};`;

            return res.status(200).json({ bundle });
          },
        },
      },
    ],
  },
];
