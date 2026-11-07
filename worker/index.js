/* Cloudflare Worker: API + статические страницы с проверкой доступа. */

import { HttpError, json, sessionUser, publicUser } from "./auth.js";
import { handleApi } from "./api.js";

const PROTECTED_PAGES = new Set([
    "/akkaunt.html",
    "/administraciya.html"
]);

function pageKey(pathname) {
    let path = pathname;
    if (path === "/" || path === "") return "/index.html";
    if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
    if (!/\.[a-z0-9]+$/i.test(path)) path += ".html";
    return path;
}

function isPageRequest(pathname) {
    return pathname === "/" || pathname.endsWith(".html") || !/\.[a-z0-9]+$/i.test(pathname);
}

function redirectTo(location) {
    return new Response(null, {
        status: 302,
        headers: { location: location, "cache-control": "no-store" }
    });
}

function safeJson(value) {
    return JSON.stringify(value)
        .replace(/</g, "\\u003c")
        .replace(/>/g, "\\u003e")
        .replace(/\u2028/g, "\\u2028")
        .replace(/\u2029/g, "\\u2029");
}

function finalize(response) {
    const headers = new Headers(response.headers);
    headers.set("x-content-type-options", "nosniff");
    headers.set("referrer-policy", "strict-origin-when-cross-origin");
    headers.set("x-frame-options", "SAMEORIGIN");
    headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()");
    headers.set(
        "content-security-policy",
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline'; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src https://fonts.gstatic.com; " +
        "img-src 'self' data: blob: https: http:; " +
        "connect-src 'self'; " +
        "base-uri 'self'; form-action 'self'; frame-ancestors 'self'"
    );
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers
    });
}

async function servePage(request, env, url) {
    const key = pageKey(url.pathname);
    const pageRequest = isPageRequest(url.pathname);

    let session = null;
    if (pageRequest) {
        try {
            session = await sessionUser(request, env);
        } catch (error) {
            console.error("session lookup failed", error);
        }
    }

    if (pageRequest) {
        if (!session && PROTECTED_PAGES.has(key)) {
            const next = key.replace(/^\//, "");
            return redirectTo("/vhod.html?next=" + encodeURIComponent(next));
        }
        if (session && key === "/administraciya.html" &&
            session.user.role !== "admin" && session.user.role !== "editor") {
            return redirectTo("/akkaunt.html?denied=admin");
        }
    }

    /* Запрашиваем у слоя ассетов канонический путь со страницей .html,
       чтобы не отдавать лишний редирект на каждый внутренний переход. */
    let assetRequest = request;
    if (pageRequest) {
        const assetUrl = new URL(request.url);
        assetUrl.pathname = key;
        assetRequest = new Request(assetUrl.toString(), {
            method: request.method,
            headers: request.headers,
            redirect: "manual"
        });
    }
    const asset = await env.ASSETS.fetch(assetRequest);

    /* Текстовые документы отдаём с явной кодировкой UTF-8,
       иначе кириллица в браузере может превратиться в «кракозябры». */
    if (url.pathname.startsWith("/docs/") && url.pathname.endsWith(".txt")) {
        const headers = new Headers(asset.headers);
        headers.set("content-type", "text/plain; charset=utf-8");
        return finalize(new Response(asset.body, { status: asset.status, headers: headers }));
    }

    const type = asset.headers.get("content-type") || "";

    if (!pageRequest || request.method === "HEAD" || asset.status !== 200 || !type.includes("text/html")) {
        return finalize(asset);
    }

    let html = await asset.text();
    const user = session ? publicUser(session.user) : null;
    const config = { discord: !!(env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET) };
    const injection = "<script>window.__USER__=" + safeJson(user) +
        ";window.__CONFIG__=" + safeJson(config) + ";</script>";

    if (html.indexOf("</head>") !== -1) {
        html = html.replace("</head>", injection + "</head>");
    } else {
        html = injection + html;
    }

    const headers = new Headers(asset.headers);
    headers.set("content-type", "text/html; charset=utf-8");
    headers.set("cache-control", "no-store");
    headers.delete("content-length");
    headers.delete("etag");
    headers.delete("last-modified");

    return finalize(new Response(html, { status: 200, headers: headers }));
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        try {
            if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
                return await handleApi(request, env, url);
            }
            return await servePage(request, env, url);
        } catch (error) {
            if (error instanceof HttpError) {
                if (url.pathname.startsWith("/api/")) {
                    return json({ error: error.message }, error.status);
                }
                return new Response(error.message, {
                    status: error.status,
                    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" }
                });
            }
            console.error(error);
            if (url.pathname.startsWith("/api/")) {
                return json({ error: "Внутренняя ошибка сервера." }, 500);
            }
            return new Response("Внутренняя ошибка сервера.", {
                status: 500,
                headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" }
            });
        }
    }
};
