function initializeSortable() {
  $(".queue-items").each(function () {
    const $element = $(this);
    const queueId = $element.data("queue-id");

    if (!queueId) return;

    $element.sortable({
      handle: ".drag-handle",
      animation: 150,
      ghostClass: "sortable-ghost",
      dragClass: "sortable-drag",
      onEnd: function (evt) {
        // Get the moved item's ID and new position
        const itemId = $(evt.item).data("item-id");
        const newPosition = evt.newIndex + 1;

        // Send API request to update order
        const $queueContainer = $(`.queue-items[data-queue-id='${queueId}']`);
        $queueContainer.wrapLoading(
          $.ajax({
            url: `/queue/${queueId}/reorder`,
            type: "PUT",
            contentType: "application/json",
            data: JSON.stringify({ itemId: itemId, newPosition: newPosition }),
            success: function (data) {
              // Use the helper function to rebuild queue items properly
              rebuildQueueItems($queueContainer, data, queueId);

              // showToast("success", t("queues.reorder_success"));
            },
            error: function () {
              // showToast("danger", t("queues.reorder_error"));
              // Revert the visual change by recreating the sortable
              location.reload();
            },
          })
        );
      },
    });
  });
}

function showAddItemInput($queueContainer, queueId) {
  // Create the input form
  const $inputForm = $(`
    <div class="add-item-input d-flex justify-content-center" style="opacity: 0; transform: translateY(-10px); transition: all 0.3s ease;">
      <div class="d-flex gap-2 align-items-center">
        <input type="text" class="form-control form-control-sm add-item-field" 
               placeholder="${t("queues.add_item_placeholder")}" 
               maxlength="300" autocomplete="off" data-bs-toggle="tooltip" data-bs-title="${t(
                 "queues.form.title.queueItemAdd"
               )}">
        <button class="btn queue-item-btn btn-secondary add-item-cancel" title="${t(
          "queues.cancel"
        )}">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
    </div>
  `);

  // Insert before the add button and transform it to send button
  const $addButton = $queueContainer.find(".btn-add");
  $addButton.before($inputForm);

  // Change the add button to send button
  $addButton.removeClass("btn-add").addClass("btn-send");
  $addButton.html('<i class="bi bi-send"></i>');
  $addButton.attr("title", t("queues.send_item"));

  let tooltip = new bootstrap.Tooltip($inputForm.find(".add-item-field"));

  // Bind send functionality directly to the transformed button
  $addButton.off("click").on("click", function (e) {
    e.preventDefault();
    e.stopPropagation();

    const itemName = $input.val().trim();
    if (itemName) {
      addQueueItem(queueId, itemName, $queueContainer);
    }
  });

  // Trigger smooth animation
  setTimeout(() => {
    $inputForm.css({
      opacity: "1",
      transform: "translateY(0)",
    });
  }, 10);

  // Focus the input
  const $input = $inputForm.find("input");
  setTimeout(() => $input.trigger("focus"), 300);

  // Handle cancel
  $inputForm.find(".add-item-cancel").on("click", function () {
    hideAddItemInput($inputForm, $addButton);
  });

  // Handle Enter key
  $input.on("keypress", function (e) {
    if (e.which === 13) {
      // Enter key
      const itemName = $input.val().trim();
      if (itemName) {
        addQueueItem(queueId, itemName, $queueContainer);
      }
    } else if (e.which === 27) {
      // Escape key
      hideAddItemInput($inputForm);
    }
  });

  // Handle escape key
  $input.on("keyup", function (e) {
    if (e.which === 27) {
      // Escape key
      hideAddItemInput($inputForm, $addButton);
    }
  });
}

function hideAddItemInput($inputForm, $addButton) {
  $inputForm.css({
    opacity: "0",
    transform: "translateY(-10px)",
  });

  // Restore the add button
  $addButton.removeClass("btn-send").addClass("btn-add");
  $addButton.html('<i class="bi bi-plus-lg"></i>');
  $addButton.attr("title", t ? t("queues.add_item") : "Add item");

  $addButton.off("click").on("click", function (e) {
    e.preventDefault();
    e.stopPropagation();

    const $button = $(this);
    const $queueContainer = $button.closest(".queue-items");
    const queueId = $queueContainer.data("queue-id");

    // Check if input already exists
    if ($queueContainer.find(".add-item-input").length > 0) {
      return;
    }

    showAddItemInput($queueContainer, queueId);
  });

  setTimeout(() => {
    $inputForm.remove();
  }, 300);
}

function addQueueItem(queueId, itemName, $queueContainer) {
  const $inputForm = $queueContainer.find(".add-item-input");
  const $sendButton = $queueContainer.find(".btn-send");

  // Show loading on the input form and send button
  $inputForm.find("input, button").prop("disabled", true);
  $sendButton
    .prop("disabled", true)
    .html('<span class="spinner-border spinner-border-sm"></span>');

  $.ajax({
    url: `/queue/${queueId}/items`,
    type: "POST",
    contentType: "application/json",
    data: JSON.stringify({ itemName: itemName }),
    success: function (data) {
      // Use the helper function to rebuild queue items properly (this will remove the input form)
      rebuildQueueItems($queueContainer, data, queueId);

      // Show success toast if available
      if (typeof showToast === "function") {
        showToast("success", t("queues.add_success"));
      }
    },
    error: function (xhr) {
      // Re-enable form and restore send button
      $inputForm.find("input, button").prop("disabled", false);
      $sendButton.prop("disabled", false).html('<i class="bi bi-send"></i>');

      let errorMessage = t ? t("queues.add_error") : "Failed to add item";
      if (xhr.responseJSON && xhr.responseJSON.error) {
        errorMessage = xhr.responseJSON.error;
      }

      // Show error toast if available
      if (typeof showToast === "function") {
        showToast("danger", errorMessage);
      } else {
        alert(errorMessage);
      }

      // Focus input again
      $inputForm.find("input").focus();
    },
  });
}

function showEditItemInput($queueItem, queueId, itemId) {
  // Mark as editing
  $queueItem.addClass("editing");

  // Get current item name and elements
  const $itemText = $queueItem.find(".queue-item-text");
  const $editButton = $queueItem.find(".btn-edit");
  const currentName = $itemText.text();
  const isPriority = $queueItem.hasClass("priority-item");

  // Replace text with input and priority checkbox
  $itemText.replaceWith(`
    <div class="d-flex align-items-center gap-2">
      <input type="text" class="form-control form-control-sm queue-item-input" 
             value="${currentName}" maxlength="100" autocomplete="off">
      <div class="form-check">
      <label class="form-check-label priority-label" title="${
        t ? t("queues.priority_item") : "Priority"
      }">
        <input class="form-check-input priority-checkbox" type="checkbox" 
               ${isPriority ? "checked" : ""}>
          <i class="bi bi-star-fill text-warning"></i>
        </label>
      </div>
    </div>
  `);

  // Transform edit button to send button
  $editButton.removeClass("btn-edit").addClass("btn-send");
  $editButton.html('<i class="bi bi-send"></i>');
  $editButton.attr("title", t ? t("queues.save_item") : "Save");

  // Get the input and checkbox for event binding
  const $input = $queueItem.find(".queue-item-input");
  const $priorityCheckbox = $queueItem.find(".priority-checkbox");

  // Focus and select the input text
  setTimeout(() => {
    $input.focus().select();
  }, 50);

  // Bind send functionality to the transformed button
  $editButton.off("click").on("click", function (e) {
    e.preventDefault();
    e.stopPropagation();

    const newName = $input.val().trim();
    const newPriority = $priorityCheckbox.is(":checked");

    if (newName && (newName !== currentName || newPriority !== isPriority)) {
      updateQueueItem(queueId, itemId, newName, newPriority, $queueItem);
    } else {
      // If no changes, just exit edit mode
      exitEditMode($queueItem, currentName);
    }
  });

  // Handle Enter key to save
  $input.on("keypress", function (e) {
    if (e.which === 13) {
      // Enter key
      const newName = $input.val().trim();
      const newPriority = $priorityCheckbox.is(":checked");

      if (newName && (newName !== currentName || newPriority !== isPriority)) {
        updateQueueItem(queueId, itemId, newName, newPriority, $queueItem);
      } else {
        exitEditMode($queueItem, currentName);
      }
    }
  });

  // Handle Escape key to cancel
  $input.on("keyup", function (e) {
    if (e.which === 27) {
      // Escape key
      exitEditMode($queueItem, currentName);
    }
  });

  // Handle clicking outside to cancel
  $(document).on("click.editItem", function (e) {
    if (!$(e.target).closest(".queue-item-draggable.editing").length) {
      exitEditMode($queueItem, currentName);
    }
  });
}

function exitEditMode($queueItem, originalName) {
  // Remove editing class
  $queueItem.removeClass("editing");

  // Get elements
  const $inputContainer = $queueItem.find(".d-flex.align-items-center.gap-2");
  const $sendButton = $queueItem.find(".btn-send");
  const itemId = $sendButton.data("item-id");

  // Replace input container with text
  $inputContainer.replaceWith(
    `<span class="queue-item-text">${originalName}</span>`
  );

  // Restore edit button
  $sendButton.removeClass("btn-send").addClass("btn-edit");
  $sendButton.html('<i class="bi bi-pencil"></i>');
  $sendButton.attr("title", t ? t("queues.titles.edit") : "Edit");

  // Remove document click handler
  $(document).off("click.editItem");

  // Rebind edit functionality
  bindEventHandlers();
}

function updateQueueItem(queueId, itemId, newName, isPriority, $queueItem) {
  const $queueContainer = $queueItem.closest(".queue-items");
  const $input = $queueItem.find(".queue-item-input");
  const $priorityCheckbox = $queueItem.find(".priority-checkbox");
  const $sendButton = $queueItem.find(".btn-send");

  // Show loading state
  $input.prop("disabled", true);
  $priorityCheckbox.prop("disabled", true);
  $sendButton
    .prop("disabled", true)
    .html('<span class="spinner-border spinner-border-sm"></span>');

  $queueContainer.wrapLoading(
    $.ajax({
      url: `/queue/${queueId}/items/${itemId}`,
      type: "PUT",
      contentType: "application/json",
      data: JSON.stringify({ itemName: newName, isPriority: isPriority }),
      success: function (data) {
        // Use the helper function to rebuild queue items properly
        rebuildQueueItems($queueContainer, data, queueId);

        // Show success toast if available
        if (typeof showToast === "function") {
          showToast(
            "success",
            t ? t("queues.update_success") : "Item updated successfully"
          );
        }
      },
      error: function (xhr) {
        // Re-enable form
        $input.prop("disabled", false);
        $priorityCheckbox.prop("disabled", false);
        $sendButton.prop("disabled", false).html('<i class="bi bi-send"></i>');

        let errorMessage = t
          ? t("queues.update_error")
          : "Failed to update item";
        if (xhr.responseJSON && xhr.responseJSON.error) {
          errorMessage = xhr.responseJSON.error;
        }

        // Show error toast if available
        if (typeof showToast === "function") {
          showToast("danger", errorMessage);
        } else {
          alert(errorMessage);
        }

        // Focus input again
        $input.focus().select();
      },
    })
  );
}

function bindEventHandlers() {
  $(".btn-completed")
    .off("click")
    .on("click", (e) => {
      e.preventDefault();
      let queueId = $(this).data("queue");
    });

  $(".btn-edit-queue")
    .off("click")
    .on("click", (e) => {
      e.preventDefault();
      let queueId = $(this).data("queue");
    });

  // Item-level edit buttons
  $(".queue-item-btn.btn-edit")
    .off("click")
    .on("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      const $button = $(this);
      const $queueItem = $button.closest(".queue-item-draggable");
      const $queueContainer = $button.closest(".queue-items");
      const queueId = $queueContainer.data("queue-id");
      const itemId = $button.data("item-id");

      // Check if already in edit mode
      if ($queueItem.hasClass("editing")) {
        return;
      }

      showEditItemInput($queueItem, queueId, itemId);
    });

  // Item-level delete buttons
  $(".queue-item-btn.btn-delete")
    .off("click")
    .on("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      const $button = $(this);
      const $queueContainer = $button.closest(".queue-items");
      const queueId = $queueContainer.data("queue-id");
      const itemId = $(this).data("item-id");

      $queueContainer.wrapLoading(
        $.ajax({
          url: `/queue/${queueId}/items/${itemId}`,
          type: "DELETE",
          success: function (data) {
            // Use the helper function to rebuild queue items properly
            rebuildQueueItems($queueContainer, data, queueId);
            showToast("success", t("queues.remove_item_success"));
          },
          error: function () {
            // Show error toast
            showToast("danger", t("queues.remove_item_error"));
          },
        })
      );
    });

  // Item-level add buttons
  $(".queue-item-btn.btn-add")
    .off("click")
    .on("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      const $button = $(this);
      const $queueContainer = $button.closest(".queue-items");
      const queueId = $queueContainer.data("queue-id");

      // Check if input already exists
      if ($queueContainer.find(".add-item-input").length > 0) {
        return;
      }

      showAddItemInput($queueContainer, queueId);
    });

  // Queue item hover expansion
  $(".queue-item-draggable")
    .off("mouseenter")
    .on("mouseenter", function () {
      const $this = $(this);

      // Remove expanded class from all items and reset their widths
      $(".queue-item-draggable").removeClass("expanded").css("width", "120px");

      // Calculate the natural width needed for this item
      const $clone = $this
        .clone()
        .css({
          position: "absolute",
          visibility: "hidden",
          width: "auto",
          whiteSpace: "nowrap",
        })
        .addClass("expanded")
        .appendTo("body");

      const naturalWidth = $clone.outerWidth();
      $clone.remove();

      // Set the calculated width and add expanded class
      $this.css("width", naturalWidth + "px").addClass("expanded");
    });

  // Click outside to collapse items
  $(document)
    .off("click.queueItems")
    .on("click.queueItems", function (e) {
      // Hide all tooltips
      $('[data-bs-toggle="tooltip"]').each(function () {
        const tooltipInstance = bootstrap.Tooltip.getInstance(this);
        if (tooltipInstance) {
          tooltipInstance.hide();
        }
      });

      if (!$(e.target).closest(".queue-item-draggable").length) {
        $(".queue-item-draggable")
          .removeClass("expanded")
          .css("width", "120px");
      }
    });

  $(".btn-delete-queue")
    .off("click")
    .on("click", function (e) {
      e.preventDefault();
      let data = $(this).data("queue");
      const $queueItem = $(this).closest(".list-group-item");
      $queueItem.wrapLoading(
        $.ajax({
          url: `/queue/${data.channelId}/${data.queueId}`,
          type: "DELETE",
          success: function (data) {
            reRenderQueues(data);

            // Show success toast
            showToast("success", t("queues.delete_success"));
          },
          error: function () {
            // Show error toast
            showToast("danger", t("queues.delete_error"));
          },
        })
      );
    });
}

function reRenderQueues(queues) {
  var $template = $(`<ul class="list-group"></ul>`);
  if (queues.count > 0) {
    queues.items.forEach((queue) => {
      const queueItems = queue.items
        ? queue.items
            .filter((item) => !item.isCompleted)
            .map((item) => item.itemName)
            .join(" ")
        : "";

      $template.append(`
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
      <div class="queue-items"
            data-queue-id="${queue.queueConfig_id}">
        ${queue.items
          .filter((item) => !item.isCompleted)
          .map(
            (item) => `
          <div class="queue-item-draggable" data-item-id="${
            item.id
          }" data-item-name="${item.itemName}">
            <i class="bi bi-grip-vertical drag-handle"></i>
            <span class="queue-item-text">${item.itemName}</span>
            <div class="queue-item-actions">
              <button class="queue-item-btn btn-edit" data-item-id="${
                item.id
              }" title="${t("queues.titles.edit")}">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="queue-item-btn btn-delete" data-item-id="${
                item.id
              }" title="${t("queues.titles.delete")}">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        `
          )
          .join("")}
          <button class="btn queue-item-btn btn-add btn-primary"><i class="bi bi-plus-lg"></i></button>
      </div>
    </div>
    <div class="min-width">
      <button type="button" class="btn-completed btn btn-sm btn-outline-primary border-0 me-1"
        data-queue="${
          queue.queueConfig_id
        }" data-bs-toggle="tooltip" data-bs-placement="left"
        data-bs-title="${t("queues.titles.complete")}">
        <i class="bi bi-list"></i>
      </button>
      <button type="button" class="btn-edit-queue btn btn-sm btn-outline-warning border-0 me-1"
        data-queue="${
          queue.queueConfig_id
        }" data-bs-toggle="tooltip" data-bs-placement="left"
        data-bs-title="${t("queues.titles.edit")}">
        <i class="bi bi-pencil-square"></i>
      </button>
      <button type="button" class="btn-delete-queue btn btn-sm btn-outline-danger border-0"
        data-queue='{"queueId": ${queue.queueConfig_id}, "channelId": ${
        queue.userId
      }}' data-bs-toggle="tooltip" data-bs-placement="left"
        data-bs-title="${t("queues.titles.delete")}">
        <i class="bi bi-trash3"></i>
      </button>
    </div>
  </div>
</li>
`);
    });
  }

  // Replace the existing queue list
  $(".list-group").replaceWith($template);

  // Reinitialize tooltips and event handlers
  $('[data-bs-toggle="tooltip"]').tooltip();
  bindEventHandlers();
  initializeSortable();
}
function rebuildQueueItems($queueContainer, data, queueId) {
  $queueContainer.forceCleanupLoading();
  // Clear existing content
  $queueContainer.html("");

  if (data.count > 0) {
    // Add each queue item
    data.items.forEach((queueItem) => {
      $queueContainer.append(`
<div class="queue-item-draggable${
        queueItem.isPriority ? " priority-item" : ""
      }" data-item-id="${queueItem.queueItem_id}" data-item-name="${
        queueItem.itemName
      }">
  <i class="bi bi-grip-vertical drag-handle"></i>
  <span class="queue-item-text">${queueItem.itemName}</span>
  <div class="queue-item-actions">
    <button class="queue-item-btn btn-edit" data-item-id="${
      queueItem.queueItem_id
    }" title="${t ? t("queues.titles.edit") : "Edit"}">
      <i class="bi bi-pencil"></i>
    </button>
    <button class="queue-item-btn btn-delete" data-item-id="${
      queueItem.queueItem_id
    }" title="${t ? t("queues.titles.delete") : "Delete"}">
      <i class="bi bi-trash3"></i>
    </button>
  </div>
</div>
      `);
    });
  }

  // Always add the add button at the end
  $queueContainer.append(
    '<button class="btn queue-item-btn btn-add"><i class="bi bi-plus-lg"></i></button>'
  );

  // Rebind all event handlers and reinitialize functionality
  bindEventHandlers();
  initializeSortable();
}

// Initialize event handlers on page load
$(function () {
  bindEventHandlers();
  initializeSortable();
});
