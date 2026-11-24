// Tiny health-check server (no dependencies). Hosts like Render require a web
// service to listen on $PORT; it also gives uptime pingers something to hit.
const http = require('http');

function startServer(name = 'POUNDZ MD') {
  const port = process.env.PORT || 3000;
  http
    .createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(`${name} is running`);
    })
    .listen(port, () => console.log(`🌐 Health server on port ${port}`));
}

module.exports = { startServer };
