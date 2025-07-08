import express from "express";
import { isAuthenticated } from "../middleware/auth.js";
import InternalApiService from "../services/InternalApiService.js";
import { validateQueueData } from "../utils/validation.js";
import {
  getAndClearToasts,
  addValidationErrors,
  addSuccess,
  addError,
} from "../utils/toast.js";

const queueRouter = express.Router();

queueRouter.get("/", isAuthenticated, async (req, res) => {
  try {
    let queues = await InternalApiService.getQueueList(
      res.locals.managing.username
    );
    const toasts = getAndClearToasts(req);
    res.render("queue", {
      title: req.t("sidebar.queues"),
      activePage: "queue",
      queues: queues,
      toasts: toasts,
    });
  } catch (error) {
    console.error("Error fetching queue list:", error);
    addError(req, error.message || req.t("other.fetch_error"));
    return res.redirect("/");
  }
});

queueRouter.post("/", isAuthenticated, async (req, res) => {
  try {
    // Validate and sanitize input data
    const validation = validateQueueData(req.body);

    if (!validation.isValid) {
      addValidationErrors(req, validation.errors);
      return res.redirect("/queue");
    }

    await InternalApiService.createQueue(res.locals.managing.username, {
      username: res.locals.managing.username,
      userId: res.locals.managing.userId,
      queueName: validation.sanitized.queueName,
      queueDescription: validation.sanitized.queueDescription,
      queueSeparator: validation.sanitized.queueSeparator,
      silentActions: validation.sanitized.silentActions,
      lng: res.locals.resolvedLanguage,
    });

    addSuccess(req, req.t("queues.create_success"));
    res.redirect("/queue");
  } catch (error) {
    console.error("Error creating queue:", error);
    addError(req, error.message || req.t("queues.create_error"));
    return res.redirect("/queue");
  }
});

queueRouter.delete(
  "/:channelId/:queueId",
  isAuthenticated,
  async (req, res) => {
    try {
      const channelId = req.params.channelId;
      const queueId = req.params.queueId;
      // addSuccess(req, req.t("queues.delete_success"));
      res
        .status(200)
        .json(await InternalApiService.deleteQueue(channelId, queueId));
    } catch (error) {
      console.error("Error deleting queue:", error);
      // addError(req, error.message || req.t("queues.delete_error"));
      return res.redirect("/queue");
    }
  }
);

queueRouter.put(
  "/:queueId/reorder",
  isAuthenticated,
  async (req, res) => {
    try {
      const queueId = req.params.queueId;
      // addSuccess(req, req.t("queues.delete_success"));
      res
        .status(200)
        .json(await InternalApiService.reorderItem(queueId, req.body));
    } catch (error) {
      console.error("Error deleting queue:", error);
      // addError(req, error.message || req.t("queues.delete_error"));
      return res.redirect("/queue");
    }
  }
);

export default queueRouter;
