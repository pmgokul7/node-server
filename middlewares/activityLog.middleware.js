import { getClientIp } from "../helper/clientMeta.js";
import { recordActivityLog } from "../services/activityLog.service.js";

function requestPath(req) {
    const path = req.path ?? req.url?.split("?")[0] ?? "/";
    return path.replace(/\/+$/, "") || "/";
}

function responsePayload(body) {
    if (!body || typeof body !== "object") return body;
    return body.data ?? body;
}

function isSuccessResponse(statusCode, body) {
    if (statusCode < 200 || statusCode >= 300) return false;
    if (body && typeof body === "object" && body.status === "error") return false;
    if (body?.data?.requiresSessionConfirmation) return false;
    return true;
}

function resolveUserId(req, body) {
    if (req.user?.id) return String(req.user.id);
    const payload = responsePayload(body);
    const id = payload?.id ?? payload?._id ?? payload?.userId;
    return id ? String(id) : null;
}

function hostScope(req) {
    const workspaceId = req.body?.workspaceId;
    if (workspaceId === null || workspaceId === "" || workspaceId === undefined) {
        return "my_space";
    }
    return "workspace";
}

const ACTIVITY_RULES = [
    {
        method: "POST",
        pattern: /^\/auth\/login$/,
        action: "auth.login",
        entityType: "session",
        summary: "User logged in",
        entityId: (_req, _res, body) => body?.sessionId ?? null,
        metadata: (req, _res, body) => ({
            email: req.body?.email ?? body?.email ?? null,
            sessionId: body?.sessionId ?? null,
        }),
        platform: (req) => req.body?.platform ?? null,
    },
    {
        method: "POST",
        pattern: /^\/auth\/logout$/,
        action: "auth.logout",
        entityType: "session",
        summary: "User signed out",
        entityId: (req, _res, body) =>
            req.body?.sessionId ?? body?.sessionId ?? req.user?.sessionId ?? null,
        metadata: (_req, _res, body) => ({
            sessionId: body?.sessionId ?? null,
            signedOutAt: body?.signedOutAt ?? null,
        }),
    },
    {
        method: "POST",
        pattern: /^\/auth\/register$/,
        action: "auth.register",
        entityType: "user",
        summary: "User registered",
        entityId: (_req, _res, body) => body?._id ?? body?.id ?? null,
        metadata: (req, _res, body) => ({
            email: req.body?.email ?? body?.email ?? null,
        }),
    },
    {
        method: "POST",
        pattern: /^\/workspaces$/,
        action: "workspace.create",
        entityType: "workspace",
        summary: "Workspace created",
        entityId: (_req, _res, body) => body?._id ?? body?.id ?? null,
        metadata: (req, _res, body) => ({
            name: req.body?.name ?? body?.name ?? null,
            memberEmails: req.body?.members ?? req.body?.memberEmails ?? [],
        }),
    },
    {
        method: "PATCH",
        pattern: /^\/workspaces\/[^/]+$/,
        action: (req) => {
            const emails = req.body?.members ?? req.body?.memberEmails ?? [];
            return emails.length ? "workspace.members_invited" : "workspace.update";
        },
        entityType: "workspace",
        summary: (req) => {
            const emails = req.body?.members ?? req.body?.memberEmails ?? [];
            return emails.length ? "Workspace members invited" : "Workspace updated";
        },
        entityId: (req) => req.params?.id ?? null,
        metadata: (req) => ({
            workspaceId: req.params?.id ?? null,
            name: req.body?.name ?? null,
            color: req.body?.color ?? null,
            memberEmails: req.body?.members ?? req.body?.memberEmails ?? [],
        }),
    },
    {
        method: "DELETE",
        pattern: /^\/workspaces\/[^/]+$/,
        action: "workspace.delete",
        entityType: "workspace",
        summary: "Workspace removed",
        entityId: (req, _res, body) => req.params?.id ?? body?._id ?? body?.id ?? null,
        metadata: (req, _res, body) => ({
            workspaceId: req.params?.id ?? null,
            name: body?.name ?? null,
        }),
    },
    {
        method: "POST",
        pattern: /^\/workspaces\/[^/]+\/workspace-key-shares$/,
        action: "workspace.key_shares",
        entityType: "workspace",
        summary: "Workspace keys shared with members",
        entityId: (req) => req.params?.id ?? null,
        metadata: (req, _res, body) => ({
            workspaceId: req.params?.id ?? null,
            sharedWith: body?.sharedWith ?? body?.shares?.length ?? null,
        }),
    },
    {
        method: "POST",
        pattern: /^\/workspaces\/[^/]+\/member-invites\/[^/]+\/resend$/,
        action: "member_invite.resend",
        entityType: "member_invite",
        summary: "Member invitation resent",
        entityId: (req) => req.params?.inviteId ?? null,
        metadata: (req) => ({
            workspaceId: req.params?.id ?? null,
            inviteId: req.params?.inviteId ?? null,
            email: req.body?.email ?? null,
        }),
    },
    {
        method: "POST",
        pattern: /^\/workspaces\/[^/]+\/member-invites\/resend$/,
        action: "member_invite.resend",
        entityType: "member_invite",
        summary: "Member invitation resent",
        entityId: (req) => req.body?.inviteId ?? null,
        metadata: (req) => ({
            workspaceId: req.params?.id ?? null,
            email: req.body?.email ?? null,
        }),
    },
    {
        method: "DELETE",
        pattern: /^\/workspaces\/[^/]+\/member-invites\/[^/]+$/,
        action: "member_invite.remove",
        entityType: "member_invite",
        summary: "Member invitation removed",
        entityId: (req) => req.params?.inviteId ?? null,
        metadata: (req) => ({
            workspaceId: req.params?.id ?? null,
            inviteId: req.params?.inviteId ?? null,
            email: req.body?.email ?? null,
        }),
    },
    {
        method: "POST",
        pattern: /^\/member-invites\/[^/]+\/accept$/,
        action: "member_invite.accept",
        entityType: "member_invite",
        summary: "Member invitation accepted",
        entityId: (req) => req.params?.inviteId ?? null,
        metadata: (req, _res, body) => ({
            inviteId: req.params?.inviteId ?? null,
            workspaceId: body?.workspaceId ?? null,
            workspaceName: body?.workspaceName ?? null,
        }),
    },
    {
        method: "POST",
        pattern: /^\/hosts$/,
        action: (req) =>
            hostScope(req) === "my_space"
                ? "host.my_space.create"
                : "host.workspace.create",
        entityType: "host",
        summary: (req) =>
            hostScope(req) === "my_space"
                ? "My Space host created"
                : "Workspace host created",
        entityId: (_req, _res, body) => body?.id ?? body?._id ?? null,
        metadata: (req, _res, body) => ({
            hostId: body?.id ?? body?._id ?? null,
            name: body?.name ?? req.body?.name ?? null,
            address: body?.host ?? body?.address ?? req.body?.host ?? req.body?.address ?? null,
            workspaceId: body?.workspaceId ?? req.body?.workspaceId ?? null,
            scope: hostScope(req),
        }),
    },
    {
        method: "PATCH",
        pattern: /^\/hosts\/[^/]+\/favorite$/,
        action: "host.favorite",
        entityType: "host",
        summary: (req) =>
            req.body?.favorite ? "Host added to favorites" : "Host removed from favorites",
        entityId: (req) => req.params?.id ?? null,
        metadata: (req, _res, body) => ({
            hostId: req.params?.id ?? body?.id ?? null,
            favorite: req.body?.favorite ?? body?.isFavorite ?? null,
        }),
    },
    {
        method: "PATCH",
        pattern: /^\/hosts\/[^/]+\/remove-from-workspace$/,
        action: "host.remove_from_workspace",
        entityType: "host",
        summary: "Host removed from workspace",
        entityId: (req) => req.params?.id ?? null,
        metadata: (req, _res, body) => ({
            hostId: req.params?.id ?? body?.id ?? null,
            name: body?.name ?? null,
            workspaceId: body?.workspaceId ?? null,
        }),
    },
    {
        method: "PATCH",
        pattern: /^\/hosts\/[^/]+$/,
        action: "host.update",
        entityType: "host",
        summary: "Host updated",
        entityId: (req) => req.params?.id ?? null,
        metadata: (req, _res, body) => ({
            hostId: req.params?.id ?? body?.id ?? null,
            name: body?.name ?? req.body?.name ?? null,
            workspaceId: body?.workspaceId ?? req.body?.workspaceId ?? null,
        }),
    },
    {
        method: "DELETE",
        pattern: /^\/hosts\/[^/]+$/,
        action: "host.delete",
        entityType: "host",
        summary: "Host deleted",
        entityId: (req) => req.params?.id ?? null,
        metadata: (req) => ({
            hostId: req.params?.id ?? null,
        }),
    },
];

function matchActivityRule(req) {
    const path = requestPath(req);
    return ACTIVITY_RULES.find(
        (rule) => rule.method === req.method && rule.pattern.test(path),
    );
}

function resolveRuleValue(value, req, res, body) {
    if (typeof value === "function") {
        return value(req, res, body);
    }
    return value ?? null;
}

function buildLogEntry(req, res, rule, body) {
    const payload = responsePayload(body);
    const action = resolveRuleValue(rule.action, req, res, payload);
    const summary = resolveRuleValue(rule.summary, req, res, payload);
    const entityId = resolveRuleValue(rule.entityId, req, res, payload);
    const metadata = resolveRuleValue(rule.metadata, req, res, payload) ?? {};
    const platform = rule.platform ? resolveRuleValue(rule.platform, req, res, payload) : null;

    return {
        userId: resolveUserId(req, body),
        action,
        entityType: rule.entityType ?? null,
        entityId,
        summary,
        metadata,
        ipAddress: getClientIp(req),
        platform,
        method: req.method,
        path: requestPath(req),
        statusCode: res.statusCode,
        success: true,
    };
}

export function activityLogMiddleware(req, res, next) {
    const rule = matchActivityRule(req);
    if (!rule) {
        next();
        return;
    }

    const originalJson = res.json.bind(res);

    res.json = function activityLoggedJson(body) {
        if (isSuccessResponse(res.statusCode, body)) {
            const entry = buildLogEntry(req, res, rule, body);
            void recordActivityLog(entry);
        }
        return originalJson(body);
    };

    next();
}

export { ACTIVITY_RULES };
