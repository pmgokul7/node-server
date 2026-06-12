import Joi from "joi";
import { sendError, sendSuccess } from "../helper/requestHandler.js";
import { throwCustomError } from "../helper/error.js";
import { listActivityLogsForUser } from "../services/activityLog.service.js";

export const getMyActivityLogs = async (req, res) => {
    try {
        const userId = req?.user?.id;
        if (!userId) {
            throwCustomError(1006);
        }

        const schema = Joi.object({
            limit: Joi.number().integer().min(1).max(50).optional(),
            cursorCreatedAt: Joi.string().isoDate().optional(),
            cursorId: Joi.string().optional(),
            fromDate: Joi.string().isoDate().optional(),
            toDate: Joi.string().isoDate().optional(),
        });

        const { error, value } = schema.validate(req.query);
        if (error) {
            throwCustomError(1006);
        }

        const cursor =
            value.cursorCreatedAt && value.cursorId
                ? {
                      createdAt: value.cursorCreatedAt,
                      id: value.cursorId,
                  }
                : null;

        const result = await listActivityLogsForUser({
            userId,
            limit: value.limit ?? 12,
            cursor,
            fromDate: value.fromDate ?? null,
            toDate: value.toDate ?? null,
        });

        await sendSuccess(req, res, "activity logs found", 200, result);
    } catch (error) {
        sendError(req, res, error);
    }
};
