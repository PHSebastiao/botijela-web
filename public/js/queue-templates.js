// Template-based rendering to remove inline HTML from JS
const QueueTemplates = {
  // Create queue item from template
  createQueueItem(item) {
    return `
      <div class="queue-item-draggable${item.isPriority ? ' priority-item' : ''}" 
           data-item-id="${item.queueItem_id}" data-item-name="${item.itemName}">
        <i class="bi bi-grip-vertical drag-handle"></i>
        <span class="queue-item-text">${item.itemName}</span>
        <div class="queue-item-actions">
          <button class="queue-item-btn btn-complete" data-item-id="${item.queueItem_id}"
                  title="${t('queues.titles.completeItem')}">
            <i class="bi bi-check-lg"></i>
          </button>
          <button class="queue-item-btn btn-edit" data-item-id="${item.queueItem_id}" 
                  title="${t('queues.titles.editItem')}">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="queue-item-btn btn-delete" data-item-id="${item.queueItem_id}" 
                  title="${t('queues.titles.removeItem')}">
            <i class="bi bi-trash3"></i>
          </button>
        </div>
      </div>
    `;
  },

  // Create edit input template
  createEditInput(currentName, isPriority, queueId, itemId) {
    return `
      <div class="d-flex align-items-center gap-2">
        <input type="text" class="form-control form-control-sm queue-item-input" 
               value="${currentName}" maxlength="100" autocomplete="off"
               data-queue-id="${queueId}" data-item-id="${itemId}">
        <div class="form-check">
          <label class="form-check-label priority-label" title="${t('queues.priority_item')}">
            <input class="form-check-input priority-checkbox" type="checkbox" 
                   ${isPriority ? 'checked' : ''}>
            <i class="bi bi-star-fill text-warning"></i>
          </label>
        </div>
      </div>
    `;
  },

  // Create add item input form template
  createAddItemInput() {
    return `
      <div class="add-item-input d-flex justify-content-center" style="opacity: 0; transform: translateY(-10px); transition: all 0.3s ease;">
        <div class="d-flex gap-2 align-items-center">
          <input type="text" class="form-control form-control-sm add-item-field" 
                 placeholder="${t("queues.add_item_placeholder")}" 
                 maxlength="300" autocomplete="off" data-bs-toggle="tooltip" 
                 data-bs-title="${t("queues.form.title.queueItemAdd")}">
          <button class="btn queue-item-btn btn-secondary add-item-cancel" title="${t("queues.cancel")}">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
      </div>
    `;
  },

  // Create add button template
  createAddButton() {
    return '<button class="btn queue-item-btn btn-add"><i class="bi bi-plus-lg"></i></button>';
  },

  // Create full queue list item template
  createQueueListItem(queue) {
    const queueItemsHtml = queue.items
      .filter((item) => !item.isCompleted)
      .map((item) => this.createQueueItem({
        queueItem_id: item.id,
        itemName: item.itemName,
        isPriority: item.isPriority
      }))
      .join('');

    return `
      <li class="list-group-item">
        <div class="d-flex justify-content-between align-items-start">
          <div class="max-width">
            <h3>${queue.queueName}</h3>
            <div name="queueInfo">
              ${t("queues.command")}: ${queue.prefix || "!"}${queue.queueName}
              |
              ${t("queues.description")}: ${queue.queueDescription}
              |
              ${t("queues.separator")}: ${queue.queueSeparator}
            </div>
            <hr>
            <div class="queue-items" data-queue-id="${queue.queueConfig_id}">
              ${queueItemsHtml}
              ${this.createAddButton()}
            </div>
          </div>
          <div class="min-width">
            <button type="button" class="btn-completed btn btn-sm btn-outline-primary border-0 me-1"
              data-queue="${queue.queueConfig_id}" data-bs-toggle="tooltip" data-bs-placement="left"
              data-bs-title="${t("queues.titles.complete")}">
              <i class="bi bi-list"></i>
            </button>
            <button type="button" class="btn-edit-queue btn btn-sm btn-outline-warning border-0 me-1"
              data-queue="${queue.queueConfig_id}" data-bs-toggle="tooltip" data-bs-placement="left"
              data-bs-title="${t("queues.titles.edit")}">
              <i class="bi bi-pencil-square"></i>
            </button>
            <button type="button" class="btn-delete-queue btn btn-sm btn-outline-danger border-0"
              data-queue='{"queueId": ${queue.queueConfig_id}, "channelId": ${queue.userId}}' 
              data-bs-toggle="tooltip" data-bs-placement="left"
              data-bs-title="${t("queues.titles.delete")}">
              <i class="bi bi-trash3"></i>
            </button>
          </div>
        </div>
      </li>
    `;
  }
};
