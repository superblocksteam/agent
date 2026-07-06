// Stand-in Databricks SQL warehouse: an HTTPS endpoint that always returns 401 so
// @databricks/sql throws THTTPException(401) -> INTEGRATION_AUTHORIZATION — the failure the
// OAuth eviction test triggers. Defined and started only by the e2e-quotas job via
// compose.full.eviction.yaml; the JS workers accept its self-signed cert because that same
// override sets NODE_TLS_REJECT_UNAUTHORIZED=0 (the driver hardcodes HTTPS).
const https = require('https');
const fs = require('fs');

const port = process.env.PORT || 8443;
const server = https.createServer(
  { key: fs.readFileSync(process.env.TLS_KEY || '/certs/key.pem'), cert: fs.readFileSync(process.env.TLS_CERT || '/certs/cert.pem') },
  (req, res) => { res.writeHead(401, { 'content-type': 'text/plain' }); res.end('mock databricks unauthorized'); },
);
server.listen(port, () => console.log(`mock databricks warehouse (HTTPS, 401) on :${port}`));
