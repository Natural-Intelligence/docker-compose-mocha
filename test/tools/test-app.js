const http = require('http');

const PORT = process.env.PORT || 8080;
const DELAY = (process.env.DELAY * 1000) || 100;

function startServer() {
  function handleRequest(request, response) {
    response.end(`Hello from test app on port ${PORT}`);
  }

  // Create a server
  const server = http.createServer(handleRequest);

  // Lets start our server
  server.listen(PORT, () => {
    // Callback triggered when server is successfully listening. Hurray!
    console.log('Server listening on: http://localhost:%s', PORT);
  });
}

setTimeout(startServer, DELAY);
