// Test-only introspection routes for e2e assertions.
// Recording logic lives in store/evictions.js; this file is a plain route array
// so @mocks-server can auto-load it without any attached-function workarounds.
const { evictions } = require('../store/evictions');

module.exports = [
  {
    id: 'test-evictions-list',
    url: '/__test__/evictions',
    method: 'GET',
    variants: [
      {
        id: 'default',
        type: 'middleware',
        options: {
          middleware: (req, res) => res.status(200).json({ evictions }),
        },
      },
    ],
  },
  {
    id: 'test-evictions-reset',
    url: '/__test__/evictions/reset',
    method: 'POST',
    variants: [
      {
        id: 'default',
        type: 'middleware',
        options: {
          middleware: (req, res) => {
            evictions.length = 0;
            res.sendStatus(200);
          },
        },
      },
    ],
  },
];
