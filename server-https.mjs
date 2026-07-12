import { createServer } from "node:https";
import { readFileSync } from "node:fs";
import { parse } from "node:url";
import next from "next";

const app    = next({ dev: true });
const handle = app.getRequestHandler();

const opts = {
  key:  readFileSync("./localhost+1-key.pem"),
  cert: readFileSync("./localhost+1.pem"),
};

app.prepare().then(() => {
  createServer(opts, (req, res) => {
    handle(req, res, parse(req.url, true));
  }).listen(3000, () => {
    console.log("> Ready on https://localhost:3000");
  });
});
