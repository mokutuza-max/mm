/* Discord OAuth2: привязка аккаунта и вход через Discord. */

import {
    fail,
    redirect,
    parseCookies,
    safeEqual,
    randomToken,
    cleanText,
    appOrigin,
    oauthStateCookie,
    clearOauthStateCookie,
    sessionUser,
    createSession,
    OAUTH_COOKIE
} from "./auth.js";

const DISCORD_API = "https://discord.com/api";
const ALLOWED_MODES = new Set(["link", "login"]);

function errorRedirect(mode, reason, request) {
    const target = mode === "login"
        ? "/vhod.html?discord=" + reason
        : "/akkaunt.html?discord=" + reason;
    return redirect(target, [clearOauthStateCookie(request)]);
}

function discordConfigured(env) {
    return !!(env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET);
}

export async function discordStart(request, env, url) {
    if (!discordConfigured(env)) fail(503, "Вход через Discord не настроен на сервере.");
    const mode = ALLOWED_MODES.has(url.searchParams.get("mode")) ? url.searchParams.get("mode") : "link";

    if (mode === "link") {
        const session = await sessionUser(request, env);
        if (!session) return redirect("/vhod.html?next=akkaunt.html");
    }

    const state = randomToken(24);
    const redirectUri = appOrigin(env, request) + "/api/auth/discord/callback";
    const authorize = new URL("https://discord.com/oauth2/authorize");
    authorize.searchParams.set("client_id", env.DISCORD_CLIENT_ID);
    authorize.searchParams.set("response_type", "code");
    authorize.searchParams.set("redirect_uri", redirectUri);
    authorize.searchParams.set("scope", "identify");
    authorize.searchParams.set("state", state);
    authorize.searchParams.set("prompt", "consent");

    return redirect(authorize.toString(), [
        oauthStateCookie(state + "." + mode, request)
    ]);
}

export async function discordCallback(request, env, url) {
    if (!discordConfigured(env)) fail(503, "Вход через Discord не настроен на сервере.");
    const stored = parseCookies(request.headers.get("Cookie"))[OAUTH_COOKIE] || "";
    const parts = stored.split(".");
    const storedState = parts[0] || "";
    const mode = parts[1] === "login" ? "login" : "link";
    const clear = clearOauthStateCookie(request);
    const state = url.searchParams.get("state") || "";
    const code = url.searchParams.get("code") || "";

    if (!code || !storedState || !safeEqual(state, storedState)) {
        return redirect(
            mode === "login" ? "/vhod.html?discord=error" : "/akkaunt.html?discord=error",
            [clear]
        );
    }

    const redirectUri = appOrigin(env, request) + "/api/auth/discord/callback";
    let tokenResponse;
    try {
        tokenResponse = await fetch(DISCORD_API + "/oauth2/token", {
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: env.DISCORD_CLIENT_ID,
                client_secret: env.DISCORD_CLIENT_SECRET,
                grant_type: "authorization_code",
                code: code,
                redirect_uri: redirectUri
            })
        });
    } catch (e) {
        return errorRedirect(mode, "error", request);
    }
    if (!tokenResponse.ok) return errorRedirect(mode, "error", request);

    let tokenData;
    try {
        tokenData = await tokenResponse.json();
    } catch (e) {
        return errorRedirect(mode, "error", request);
    }
    if (!tokenData || !tokenData.access_token) return errorRedirect(mode, "error", request);

    let profileResponse;
    try {
        profileResponse = await fetch(DISCORD_API + "/users/@me", {
            headers: { authorization: "Bearer " + tokenData.access_token }
        });
    } catch (e) {
        return errorRedirect(mode, "error", request);
    }
    if (!profileResponse.ok) return errorRedirect(mode, "error", request);

    let profile;
    try {
        profile = await profileResponse.json();
    } catch (e) {
        return errorRedirect(mode, "error", request);
    }

    const discordId = String(profile && profile.id ? profile.id : "");
    if (!/^\d{5,25}$/.test(discordId)) return errorRedirect(mode, "error", request);
    const username = cleanText(profile.username, 64) || "discord";
    const globalName = cleanText(profile.global_name, 100);
    const now = Date.now();

    if (mode === "link") {
        const session = await sessionUser(request, env);
        if (!session) {
            return redirect("/vhod.html?next=akkaunt.html", [clear]);
        }

        const other = await env.DB.prepare(
            "SELECT id FROM users WHERE discord_id = ? AND id <> ?"
        ).bind(discordId, session.user.id).first();
        if (other) return redirect("/akkaunt.html?discord=exists", [clear]);

        try {
            await env.DB.prepare(
                "UPDATE users SET discord_id = ?, discord_username = ?, discord_global_name = ?, updated_at = ? WHERE id = ?"
            ).bind(discordId, username, globalName, now, session.user.id).run();
        } catch (e) {
            if (/UNIQUE/i.test(String(e && e.message))) {
                return redirect("/akkaunt.html?discord=exists", [clear]);
            }
            throw e;
        }
        return redirect("/akkaunt.html?discord=linked", [clear]);
    }

    const user = await env.DB.prepare("SELECT * FROM users WHERE discord_id = ?")
        .bind(discordId).first();
    if (!user) return redirect("/vhod.html?discord=not_linked", [clear]);
    if (user.state === "blocked") return redirect("/vhod.html?discord=blocked", [clear]);
    if (user.state === "pending") return redirect("/vhod.html?discord=pending", [clear]);

    await env.DB.prepare("UPDATE users SET last_login = ? WHERE id = ?")
        .bind(now, user.id).run();
    const session = await createSession(env, user.id, request);
    return redirect("/akkaunt.html?discord=login", [clear, session.cookie]);
}
