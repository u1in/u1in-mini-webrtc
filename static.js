const path = require("path");
const Koa = require("koa");
const static = require("koa-static");

const app = new Koa();

app.use(static(path.join(__dirname, "static")));

app.listen(3000, "0.0.0.0", () => {
  console.log("Server running on port http://localhost:3000");
});
