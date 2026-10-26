import { currentUser, findArticle } from "./article-store.mjs";
import {
  handleGetArticle,
  handleGetArticles,
  handleUpdateArticle,
} from "./article-handlers.mjs";
import { sendJson } from "./http.mjs";

const articleHandlers = {
  GET: handleGetArticle,
  PUT: handleUpdateArticle,
};

export async function handleRequest(request, response) {
  const pathname = new URL(request.url, "http://localhost").pathname;

  if (request.method === "GET" && pathname === "/api/me") {
    return sendJson(response, 200, currentUser);
  }
  if (request.method === "GET" && pathname === "/api/articles") {
    return handleGetArticles(request, response);
  }

  const match = pathname.match(/^\/api\/articles\/([^/]+)$/);
  const article = match && findArticle(match[1]);
  if (!article) {
    return sendJson(response, 404, { message: "게시글이 없습니다." });
  }

  const handler = Object.hasOwn(articleHandlers, request.method)
    ? articleHandlers[request.method]
    : null;
  if (!handler) {
    response.setHeader("Allow", "GET, PUT");
    return sendJson(response, 405, { message: "지원하지 않는 메서드입니다." });
  }

  return handler(request, response, article);
}
