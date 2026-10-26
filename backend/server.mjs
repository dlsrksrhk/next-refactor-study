import { createServer } from "node:http";
import { handleRequest } from "./routes.mjs";

const server = createServer(handleRequest);
const port = Number(process.env.PORT ?? 4000);

server.listen(port, "127.0.0.1", () => {
  console.log(`게시글 목업 API: http://127.0.0.1:${server.address().port}`);
});
