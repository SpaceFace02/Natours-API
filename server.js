// Everything related to the server goes here

const app = require("./app");

// Start Server
const port = 3000;
app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});
