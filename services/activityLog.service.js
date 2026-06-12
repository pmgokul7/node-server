import ActivityLog from "../models/activityLog.model.js";
import { Types } from "mongoose";

const DEFAULT_LIMIT = 12;

function formatActivityLog(row) {
    return {
        id: String(row._id),
        userId: row.userId ? String(row.userId) : null,
        action: row.action,
        entityType: row.entityType ?? null,
        entityId: row.entityId ?? null,
        summary: row.summary ?? null,
        metadata: row.metadata ?? {},
        ipAddress: row.ipAddress ?? null,
        platform: row.platform ?? null,
        method: row.method,
        path: row.path,
        statusCode: row.statusCode,
        success: Boolean(row.success),
        createdAt: row.createdAt,
    };
}

export async function recordActivityLog(entry) {
    try {
        const userId = entry.userId
            ? new Types.ObjectId(String(entry.userId))
            : null;

        await ActivityLog.create({
            userId,
            action: entry.action,
            entityType: entry.entityType ?? null,
            entityId: entry.entityId ? String(entry.entityId) : null,
            summary: entry.summary ?? null,
            metadata: entry.metadata ?? {},
            ipAddress: entry.ipAddress ?? null,
            platform: entry.platform ?? null,
            method: entry.method,
            path: entry.path,
            statusCode: entry.statusCode,
            success: Boolean(entry.success),
        });
    } catch (error) {
        console.error("activity log write failed:", error);
    }
}

export async function listActivityLogsForUser({
    userId,
    limit = DEFAULT_LIMIT,
    cursor = null,
    fromDate = null,
    toDate = null,
}) {
    const safeLimit = Math.min(Math.max(Number(limit) || DEFAULT_LIMIT, 1), 50);
    const query = {
        userId: new Types.ObjectId(String(userId)),
    };

    if (fromDate || toDate) {
        query.createdAt = {};
        if (fromDate) {
            query.createdAt.$gte = new Date(fromDate);
        }
        if (toDate) {
            const end = new Date(toDate);
            end.setHours(23, 59, 59, 999);
            query.createdAt.$lte = end;
        }
    }

    if (cursor?.createdAt && cursor?.id && Types.ObjectId.isValid(cursor.id)) {
        const cursorDate = new Date(cursor.createdAt);
        const cursorObjectId = new Types.ObjectId(cursor.id);
        query.$and = [
            {
                $or: [
                    { createdAt: { $lt: cursorDate } },
                    {
                        createdAt: cursorDate,
                        _id: { $lt: cursorObjectId },
                    },
                ],
            },
        ];
    }

    const rows = await ActivityLog.find(query)
        .sort({ createdAt: -1, _id: -1 })
        .limit(safeLimit + 1)
        .lean();

    const hasMore = rows.length > safeLimit;
    const slice = hasMore ? rows.slice(0, safeLimit) : rows;
    const items = slice.map(formatActivityLog);
    const last = slice[slice.length - 1];

    return {
        items,
        hasMore,
        nextCursor:
            hasMore && last
                ? {
                      cursorCreatedAt: new Date(last.createdAt).toISOString(),
                      cursorId: String(last._id),
                  }
                : null,
    };
}
