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

queueRouter.get("/queues", isAuthenticated, async (req, res) => {
  try {
    let queues = await InternalApiService.getQueueList(
      res.locals.managing.username
    );
    res.status(200).json({
      items: queues,
      count: queues.length,
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

    await InternalApiService.createQueue(res.locals.managing.username, res.locals.user.username, {
      username: res.locals.managing.username,
      userId: res.locals.managing.userId,
      queueName: validation.sanitized.queueName,
      queueDescription: validation.sanitized.queueDescription,
      queueSeparator: validation.sanitized.queueSeparator,
      silentActions: validation.sanitized.silentActions,
      lng: res.locals.resolvedLanguage,
    });

    addSuccess(req, req.t("queues.create_success"));
  } catch (error) {
    console.error("Error creating queue:", error);
    return res
      .status(500)
      .json({ error: error.message || req.t("queues.create_error") });
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
      return res
      .status(500)
      .json({ error: error.message || req.t("queues.delete_error") });
    }
  }
);

queueRouter.put("/:queueId/reorder", isAuthenticated, async (req, res) => {
  try {
    const queueId = req.params.queueId;
    // addSuccess(req, req.t("queues.reorder_success"));
    let result = await InternalApiService.reorderItem(queueId, req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error reordering queue:", error);
    return res
      .status(500)
      .json({ error: error.message || req.t("queues.reorder_error") });
  }
});

queueRouter.post("/:queueId/items", isAuthenticated, async (req, res) => {
  try {
    const queueId = req.params.queueId;
    const { itemName } = req.body;

    if (!itemName || itemName.trim().length === 0) {
      return res
        .status(400)
        .json({ error: req.t("queues.item_name_required") });
    }

    await InternalApiService.addQueueItem(queueId, {
      queueItems: itemName.trim(),
    });

    let result = await InternalApiService.getActiveQueueItems(queueId);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error adding queue item:", error);
    return res
      .status(500)
      .json({ error: error.message || req.t("queues.add_item_error") });
  }
});

queueRouter.delete(
  "/:queueId/items/:itemId",
  isAuthenticated,
  async (req, res) => {
    try {
      const queueId = req.params.queueId;
      const itemId = req.params.itemId;

      let result = await InternalApiService.removeQueueItem(queueId, itemId);
      res.status(201).json(result);
    } catch (error) {
      console.error("Error adding queue item:", error);
      return res
        .status(500)
        .json({ error: error.message || req.t("queues.add_item_error") });
    }
  }
);

queueRouter.post(
  "/:queueId/items/:itemId/complete",
  isAuthenticated,
  async (req, res) => {
    try {
      const queueId = req.params.queueId;
      const itemId = req.params.itemId;

      let result = await InternalApiService.completeQueueItem(queueId, itemId);
      res.status(201).json(result);
    } catch (error) {
      console.error("Error adding queue item:", error);
      return res
        .status(500)
        .json({ error: error.message || req.t("queues.add_item_error") });
    }
  }
);

queueRouter.put(
  "/:queueId/items/:itemId",
  isAuthenticated,
  async (req, res) => {
    try {
      const { queueId, itemId } = req.params;
      const { itemName, isPriority } = req.body;

      if (!itemName || itemName.trim().length === 0) {
        return res
          .status(400)
          .json({ error: req.t("queues.item_name_required") });
      }

      await InternalApiService.updateQueueItem(queueId, itemId, {
        itemName: itemName.trim(),
        isPriority: isPriority || false,
      });

      let result = await InternalApiService.getActiveQueueItems(queueId);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error updating queue item:", error);
      return res
        .status(500)
        .json({ error: error.message || req.t("queues.update_error") });
    }
  }
);

// GET route to fetch queue data for editing
queueRouter.get("/:queueId/edit", isAuthenticated, async (req, res) => {
  try {
    const queueId = req.params.queueId;
    const queueData = await InternalApiService.getQueue(queueId);
    res.status(200).json(queueData);
  } catch (error) {
    console.error("Error fetching queue data:", error);
    return res
      .status(500)
      .json({ error: error.message || req.t("queues.edit_error") });
  }
});

// PUT route to update queue data
queueRouter.put("/:queueId", isAuthenticated, async (req, res) => {
  try {
    const queueId = req.params.queueId;
    const validation = validateQueueData(req.body);

    if (!validation.isValid) {
      return res.status(400).json({ error: validation.errors.join(", ") });
    }

    await InternalApiService.updateQueue(queueId, {
      queueName: validation.sanitized.queueName,
      queueDescription: validation.sanitized.queueDescription,
      queueSeparator: validation.sanitized.queueSeparator,
      silentActions: validation.sanitized.silentActions,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error updating queue:", error);
    return res
      .status(500)
      .json({ error: error.message || req.t("queues.edit_error") });
  }
});

// GET route to fetch completed items with pagination
queueRouter.get("/:queueId/completed", isAuthenticated, async (req, res) => {
  try {
    const queueId = req.params.queueId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const result = await InternalApiService.getCompletedQueueItems(
      queueId,
      page,
      limit
    );
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching completed items:", error);
    return res
      .status(500)
      .json({ error: error.message || req.t("queues.fetch_error") });
  }
});

// DELETE route to remove completed item
queueRouter.delete(
  "/:queueId/completed/:itemId",
  isAuthenticated,
  async (req, res) => {
    try {
      const queueId = req.params.queueId;
      const itemId = req.params.itemId;

      await InternalApiService.removeCompletedQueueItem(queueId, itemId);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error removing completed item:", error);
      return res
        .status(500)
        .json({ error: error.message || req.t("queues.remove_error") });
    }
  }
);

export default queueRouter;
