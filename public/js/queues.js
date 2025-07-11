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
        if (evt.newIndex == evt.oldIndex) return;
        const newPosition = evt.newIndex + 1;

        // Send API request to update order
        const $queueContainer = $(`.queue-items[data-queue-id='${queueId}']`);
        $queueContainer.wrapLoading(
          QueueAPI.reorderItems(queueId, {
            itemId: itemId,
            newPosition: newPosition,
          })
            .done(function (data) {
              // Optimistic update - item already moved, just clean up loading and refresh hover effects
              $queueContainer.forceCleanupLoading();
              initializeHoverEffects();

              // Optional: Show success toast
              // showToast("success", t("queues.reorder_success"));
            })
            .fail(function () {
              // showToast("danger", t("queues.reorder_error"));
              // Revert the visual change by recreating the sortable
              location.reload();
            })
        );
      },
    });
  });
}

function showAddItemInput($queueContainer, queueId) {
  // Create the input form using template
  const $inputForm = $(QueueTemplates.createAddItemInput());

  // Insert before the add button and transform it to send button
  const $addButton = $queueContainer.find(".btn-add");
  $addButton.before($inputForm);

  // Change the add button to send button
  $addButton.removeClass("btn-add").addClass("btn-send");
  $addButton.html('<i class="bi bi-send"></i>');
  $addButton.attr("title", t("queues.save_item"));

  let tooltip = new bootstrap.Tooltip($inputForm.find(".add-item-field"));

  // No need to bind click handler - event delegation handles it via handleSendItem

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

  // Keypress and keyup are handled by event delegation - no need for direct binding
}

function hideAddItemInput($inputForm, $addButton) {
  $inputForm.css({
    opacity: "0",
    transform: "translateY(-10px)",
  });

  // Restore the add button
  $addButton.removeClass("btn-send").addClass("btn-add");
  $addButton.html('<i class="bi bi-plus-lg"></i>');
  $addButton.attr("title", t("queues.add_item"));

  // No need to bind click handler - event delegation handles it via handleAddItem

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

  $queueContainer.wrapLoading(
    QueueAPI.addItem(queueId, { itemName: itemName })
      .done(function (data) {
        // Use the helper function to rebuild queue items properly (this will remove the input form)
        rebuildQueueItems($queueContainer, data, queueId);

        // Show success toast if available
        if (typeof showToast === "function") {
          showToast("success", t("queues.add_success"));
        }
      })
      .fail(function (xhr) {
        // Re-enable form and restore send button
        $inputForm.find("input, button").prop("disabled", false);
        $sendButton.prop("disabled", false).html('<i class="bi bi-send"></i>');

        let errorMessage = t("queues.add_item_error");
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
      })
  );
}

function showEditItemInput($queueItem, queueId, itemId) {
  // Mark as editing
  $queueItem.addClass("editing");

  // Get current item name and elements
  const $itemText = $queueItem.find(".queue-item-text");
  const $editButton = $queueItem.find(".btn-edit");
  const currentName = $itemText.text();
  const isPriority = $queueItem.hasClass("priority-item");

  // Replace text with input and priority checkbox using template
  $itemText.replaceWith(
    QueueTemplates.createEditInput(currentName, isPriority, queueId, itemId)
  );

  // Transform edit button to send button
  $editButton.removeClass("btn-edit").addClass("btn-send");
  $editButton.html('<i class="bi bi-send"></i>');
  $editButton.attr("title", t("queues.save_item"));

  // Get the input and checkbox for event binding
  const $input = $queueItem.find(".queue-item-input");
  const $priorityCheckbox = $queueItem.find(".priority-checkbox");

  // Focus and select the input text with better timing
  requestAnimationFrame(() => {
    $input.focus().select();
  });

  // Store the current values for comparison in the delegated handler
  $queueItem.data("original-name", currentName);
  $queueItem.data("original-priority", isPriority);

  // Event delegation handles the send button click and keyboard events

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
  $sendButton.attr("title", t("queues.titles.editItem"));

  // Remove document click handler
  $(document).off("click.editItem");

  // No more rebinding needed - event delegation handles it!
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
    QueueAPI.updateItem(queueId, itemId, {
      itemName: newName,
      isPriority: isPriority,
    })
      .done(function (data) {
        // Use the helper function to rebuild queue items properly
        rebuildQueueItems($queueContainer, data, queueId);

        // Show success toast if available
        if (typeof showToast === "function") {
          showToast("success", t("queues.update_success"));
        }
      })
      .fail(function (xhr) {
        // Re-enable form
        $input.prop("disabled", false);
        $priorityCheckbox.prop("disabled", false);
        $sendButton.prop("disabled", false).html('<i class="bi bi-send"></i>');

        let errorMessage = t("queues.update_error");
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
      })
  );
}

// Delegated event handlers (replace bindEventHandlers function)
function handleCompletedList(e) {
  e.preventDefault();
  let queueId = $(this).data("queue");
  // TODO: Implement completed list functionality
}

function handleEditQueue(e) {
  e.preventDefault();
  const $button = $(e.currentTarget);
  const queueId = $button.data("queue");

  // Show loading state
  $button
    .prop("disabled", true)
    .html('<span class="spinner-border spinner-border-sm"></span>');

  // Use centralized API
  QueueAPI.getQueue(queueId)
    .done(function (data) {
      // Populate the form with queue data
      $("#editQueueName").val(data.queueName);
      $("#editQueueDescription").val(data.queueDescription);
      $("#editQueueSeparator").val(data.queueSeparator);
      $("#editSilentActions").prop("checked", data.silentActions);

      // Store queue ID for later use
      $("#editQueueModal").data("queue-id", queueId);

      // Show the modal
      const modal = new bootstrap.Modal(
        document.getElementById("editQueueModal")
      );
      modal.show();

      // Tooltips already initialized once
    })
    .fail(function () {
      showToast("danger", t("queues.edit_error"));
    })
    .always(function () {
      // Reset button state
      $button
        .prop("disabled", false)
        .html('<i class="bi bi-pencil-square"></i>');
    });
}

function handleEditItem(e) {
  e.preventDefault();
  e.stopPropagation();

  const $button = $(e.currentTarget);
  const $queueItem = $button.closest(".queue-item-draggable");
  const $queueContainer = $button.closest(".queue-items");
  const queueId = $queueContainer.data("queue-id");
  const itemId = $button.data("item-id");

  // Check if already in edit mode
  if ($queueItem.hasClass("editing")) {
    return;
  }

  showEditItemInput($queueItem, queueId, itemId);
}

function handleDeleteItem(e) {
  e.preventDefault();
  e.stopPropagation();

  const $button = $(e.currentTarget);
  const $queueContainer = $button.closest(".queue-items");
  const queueId = $queueContainer.data("queue-id");
  const itemId = $button.data("item-id");

  $queueContainer.wrapLoading(
    QueueAPI.deleteItem(queueId, itemId)
      .done(function (data) {
        rebuildQueueItems($queueContainer, data, queueId);
        showToast("success", t("queues.remove_item_success"));
      })
      .fail(function () {
        showToast("danger", t("queues.remove_item_error"));
      })
  );
}

function handleCompleteItem(e) {
  e.preventDefault();
  e.stopPropagation();

  const $button = $(e.currentTarget);
  const $queueContainer = $button.closest(".queue-items");
  const queueId = $queueContainer.data("queue-id");
  const itemId = $button.data("item-id");

  $queueContainer.wrapLoading(
    QueueAPI.completeItem(queueId, itemId)
      .done(function (data) {
        rebuildQueueItems($queueContainer, data, queueId);
        showToast("success", t("queues.complete_item_success"));
      })
      .fail(function () {
        showToast("danger", t("queues.complete_item_error"));
      })
  );
}

function handleAddItem(e) {
  e.preventDefault();
  e.stopPropagation();

  const $button = $(e.currentTarget);
  const $queueContainer = $button.closest(".queue-items");
  const queueId = $queueContainer.data("queue-id");

  // Check if input already exists
  if ($queueContainer.find(".add-item-input").length > 0) {
    return;
  }

  showAddItemInput($queueContainer, queueId);
}

function handleSendItem(e) {
  e.preventDefault();
  e.stopPropagation();

  const $button = $(e.currentTarget);
  const $queueContainer = $button.closest(".queue-items");
  const queueId = $queueContainer.data("queue-id");

  // Check if this is an add operation (has add-item-field)
  const $addInput = $queueContainer.find(".add-item-field");
  if ($addInput.length > 0) {
    const itemName = $addInput.val().trim();
    if (itemName) {
      addQueueItem(queueId, itemName, $queueContainer);
    }
    return;
  }

  // Otherwise it's an edit operation
  const $queueItem = $button.closest(".queue-item-draggable");
  const $editInput = $queueItem.find(".queue-item-input");
  const $priorityCheckbox = $queueItem.find(".priority-checkbox");
  const itemId = $button.data("item-id");

  if ($editInput.length > 0) {
    const newName = $editInput.val().trim();
    const newPriority = $priorityCheckbox.is(":checked");
    const originalName = $queueItem.data("original-name");
    const originalPriority = $queueItem.data("original-priority");

    if (
      newName &&
      (newName !== originalName || newPriority !== originalPriority)
    ) {
      updateQueueItem(queueId, itemId, newName, newPriority, $queueItem);
    } else {
      // If no changes, just exit edit mode
      exitEditMode($queueItem, originalName);
    }
  }
}

function handleCancelAdd(e) {
  const $button = $(e.currentTarget);
  const $inputForm = $button.closest(".add-item-input");
  const $addButton = $inputForm.siblings(".btn-add");
  hideAddItemInput($inputForm, $addButton);
}

// Queue item hover expansion
$(".queue-item-draggable")
  .off("mouseenter")
  .on("mouseenter", function () {
    const $this = $(this);

    // Remove expanded class from all items and reset their widths
    $(".queue-item-draggable:not(.editing)").css("width", "120px");
    $(".queue-item-draggable").removeClass("expanded");

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
    $(".tooltip").remove();

    if (!$(e.target).closest(".queue-item-draggable").length) {
      $(".queue-item-draggable").removeClass("expanded").css("width", "120px");
    }
  });

$(".btn-delete-queue")
  .off("click")
  .on("click", function (e) {
    e.preventDefault();
    let data = $(this).data("queue");
    const $queueItem = $(this).closest(".list-group");
    const $listGroupItem = $(this).closest(".list-group-item");

    // Get queue name for display in modal
    const queueName = $listGroupItem.find("h3").text();

    // Set queue name in modal and store queue data
    $("#queueNameToDelete").text(queueName);
    $("#deleteQueueModal").data("queue-data", data);
    $("#deleteQueueModal").data("queue-item", $queueItem);

    // Show the modal
    const modal = new bootstrap.Modal(
      document.getElementById("deleteQueueModal")
    );
    modal.show();
  });

// Handle modal confirmation
$("#confirmDeleteQueue")
  .off("click")
  .on("click", function () {
    const data = $("#deleteQueueModal").data("queue-data");
    const $queueItem = $("#deleteQueueModal").data("queue-item");

    // Hide the modal
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("deleteQueueModal")
    );
    modal.hide();

    // Perform the deletion
    $queueItem.wrapLoading(
      $.ajax({
        url: `/queue/${data.channelId}/${data.queueId}`,
        type: "DELETE",
        success: function (data) {
          reRenderQueues(data);
          showToast("success", t("queues.delete_success"));
        },
        error: function () {
          showToast("danger", t("queues.delete_error"));
        },
      })
    );
  });

// Handle edit queue modal save
$("#saveQueueChanges")
  .off("click")
  .on("click", function () {
    const queueId = $("#editQueueModal").data("queue-id");
    const $button = $(this);
    const $buttonText = $button.find(".button-text");
    const $buttonSpinner = $button.find(".button-spinner");

    // Show loading state
    $buttonText.addClass("d-none");
    $buttonSpinner.removeClass("d-none");
    $button.prop("disabled", true);

    // Prepare form data
    const formData = {
      queueName: $("#editQueueName").val().trim(),
      queueDescription: $("#editQueueDescription").val().trim(),
      queueSeparator: $("#editQueueSeparator").val().trim(),
      silentActions: $("#editSilentActions").is(":checked"),
    };

    // Submit the form
    $.ajax({
      url: `/queue/${queueId}`,
      type: "PUT",
      contentType: "application/json",
      data: JSON.stringify(formData),
      success: function (data) {
        // Hide the modal
        const modal = bootstrap.Modal.getInstance(
          document.getElementById("editQueueModal")
        );
        modal.hide();

        // Reload the page to show updated data
        location.reload();

        // Show success toast
        showToast("success", t("queues.edit_success"));
      },
      error: function (xhr) {
        let errorMessage = t("queues.edit_error");
        if (xhr.responseJSON && xhr.responseJSON.error) {
          errorMessage = xhr.responseJSON.error;
        }
        showToast("danger", errorMessage);
      },
      complete: function () {
        // Reset button state
        $buttonText.removeClass("d-none");
        $buttonSpinner.addClass("d-none");
        $button.prop("disabled", false);
      },
    });
  });

function reRenderQueues(queues) {
  var $template = $(`<ul class="list-group"></ul>`);
  if (queues.count > 0) {
    queues.items.forEach((queue) => {
      // Use template system for entire queue list item
      $template.append(QueueTemplates.createQueueListItem(queue));
    });
  } else {
    $("main").append(t("queues.no_queues"));
  }

  // Replace the existing queue list
  $(".list-group").replaceWith($template);

  // Only reinitialize what's needed
  initializeSortable();
  initializeHoverEffects();
}
function rebuildQueueItems($queueContainer, data, queueId) {
  $queueContainer.forceCleanupLoading();
  // Clear existing content
  $queueContainer.html("");

  if (data.count > 0) {
    // Add each queue item using template
    data.items.forEach((queueItem) => {
      $queueContainer.append(QueueTemplates.createQueueItem(queueItem));
    });
  }

  // Always add the add button at the end using template
  $queueContainer.append(QueueTemplates.createAddButton());

  // Only reinitialize what's needed - no more rebinding!
  initializeSortable();
  initializeHoverEffects();
}

// Centralized API service with enhanced error handling
const QueueAPI = {
  request(url, options = {}) {
    const config = {
      type: options.method || "GET",
      contentType: "application/json",
      ...options,
    };

    if (config.data && typeof config.data === "object") {
      config.data = JSON.stringify(config.data);
    }

    return $.ajax(url, config).fail(function (xhr, status, error) {
      // Enhanced error logging
      console.error(`API Error [${config.type} ${url}]:`, {
        status: xhr.status,
        statusText: xhr.statusText,
        responseText: xhr.responseText,
        error: error,
      });

      // Show user-friendly error message
      let errorMessage = "An unexpected error occurred.";
      if (xhr.responseJSON && xhr.responseJSON.error) {
        errorMessage = xhr.responseJSON.error;
      } else if (xhr.status === 404) {
        errorMessage = "Resource not found.";
      } else if (xhr.status === 500) {
        errorMessage = "Server error. Please try again later.";
      }

      if (typeof showToast === "function") {
        showToast("danger", errorMessage);
      }
    });
  },

  updateItem: (queueId, itemId, data) =>
    QueueAPI.request(`/queue/${queueId}/items/${itemId}`, {
      method: "PUT",
      data,
    }),
  deleteItem: (queueId, itemId) =>
    QueueAPI.request(`/queue/${queueId}/items/${itemId}`, { method: "DELETE" }),
  addItem: (queueId, data) =>
    QueueAPI.request(`/queue/${queueId}/items`, { method: "POST", data }),
  completeItem: (queueId, itemId) =>
    QueueAPI.request(`/queue/${queueId}/items/${itemId}/complete`, {
      method: "POST",
    }),
  reorderItems: (queueId, data) =>
    QueueAPI.request(`/queue/${queueId}/reorder`, { method: "PUT", data }),
  deleteQueue: (channelId, queueId) =>
    QueueAPI.request(`/queue/${channelId}/${queueId}`, { method: "DELETE" }),
  getQueue: (queueId) => QueueAPI.request(`/queue/${queueId}/edit`),
  updateQueue: (queueId, data) =>
    QueueAPI.request(`/queue/${queueId}`, { method: "PUT", data }),
  getCompletedItems: (queueId, page, limit) =>
    QueueAPI.request(`/queue/${queueId}/completed?page=${page}&limit=${limit}`),
  removeCompletedItem: (queueId, itemId) =>
    QueueAPI.request(`/queue/${queueId}/completed/${itemId}`, {
      method: "DELETE",
    }),
};

// Initialize with event delegation
$(function () {
  initializeSortable();
  initializeEventDelegation();
  initializeTooltips();
});

// One-time tooltip initialization with accessibility improvements
function initializeTooltips() {
  $('[data-bs-toggle="tooltip"]').tooltip();

  // Add accessibility enhancements
  $(".queue-item-btn.btn-edit").attr("aria-label", t("queues.titles.editItem"));
  $(".queue-item-btn.btn-delete").attr(
    "aria-label",
    t("queues.titles.removeItem")
  );
  $(".queue-item-btn.btn-complete").attr(
    "aria-label",
    t("queues.titles.completeItem")
  );
  $(".queue-item-draggable").attr("tabindex", "0").attr("role", "button");

  // Add keyboard support
  $(document).on("keydown", ".queue-item-draggable", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      $(this).find(".btn-edit").click();
    }
  });
}

// Event delegation
function initializeEventDelegation() {
  $(document)
    // Queue item actions
    .on("click", ".queue-item-btn.btn-edit", handleEditItem)
    .on("click", ".queue-item-btn.btn-delete", handleDeleteItem)
    .on("click", ".queue-item-btn.btn-complete", handleCompleteItem)
    .on("click", ".queue-item-btn.btn-add", handleAddItem)
    .on("click", ".queue-item-btn.btn-send", handleSendItem)
    .on("click", ".add-item-cancel", handleCancelAdd)

    // Queue actions
    .on("click", ".btn-delete-queue", handleDeleteQueue)
    .on("click", ".btn-edit-queue", handleEditQueue)
    .on("click", ".btn-completed", handleCompletedButtonClick)

    // Modal actions
    .on("click", "#confirmDeleteQueue", handleConfirmDelete)
    .on("click", "#saveQueueChanges", handleSaveQueue)
    .on("click", "#prevPageBtn", handlePreviousPage)
    .on("click", "#nextPageBtn", handleNextPage)
    .on("click", ".btn-remove-completed", handleRemoveCompletedItem)

    // Form submissions
    .on("keypress", ".add-item-field", handleAddItemKeypress)
    .on("keypress", ".queue-item-input", function (e) {
      handleEditItemKeypress(e);
    })
    .on("keydown", ".queue-item-input", function (e) {
      if (e.which === 13 || e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        handleEditItemKeypress(e);
      }
    })
    .on("keyup", ".add-item-field, .queue-item-input", handleEscapeKey)

    // Click outside to collapse items (preserving your hover functionality)
    .on("click.queueItems", handleClickOutside);

  // Initialize hover effects separately
  initializeHoverEffects();
}

function initializeHoverEffects() {
  // Queue item hover expansion
  $(".queue-item-draggable")
    .off("mouseenter")
    .on("mouseenter", function () {
      const $this = $(this);

      // Remove expanded class from all items and reset their widths
      $(".queue-item-draggable:not(.editing)").css("width", "120px");
      $(".queue-item-draggable").removeClass("expanded");

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
}

function handleClickOutside(e) {
  // Hide all tooltips
  $(".tooltip").remove();

  if (!$(e.target).closest(".queue-item-draggable").length) {
    $(".queue-item-draggable").removeClass("expanded").css("width", "120px");
  }
}

function handleDeleteQueue(e) {
  e.preventDefault();
  const $button = $(e.currentTarget);
  const data = $button.data("queue");
  const $queueItem = $button.closest(".list-group");

  // Get queue name for display in modal
  const queueName = $queueItem.find("h3").text();

  // Set queue name in modal and store queue data
  $("#queueNameToDelete").text(queueName);
  $("#deleteQueueModal").data("queue-data", data);
  $("#deleteQueueModal").data("queue-item", $queueItem);

  // Show the modal
  const modal = new bootstrap.Modal(
    document.getElementById("deleteQueueModal")
  );
  modal.show();
}

function handleConfirmDelete() {
  const data = $("#deleteQueueModal").data("queue-data");
  const $queueItem = $("#deleteQueueModal").data("queue-item");

  // Hide the modal
  const modal = bootstrap.Modal.getInstance(
    document.getElementById("deleteQueueModal")
  );
  modal.hide();

  // Perform the deletion using centralized API
  $queueItem.wrapLoading(
    QueueAPI.deleteQueue(data.channelId, data.queueId)
      .done(function (data) {
        reRenderQueues(data);
        showToast("success", t("queues.delete_success"));
      })
      .fail(function () {
        showToast("danger", t("queues.delete_error"));
      })
  );
}

function handleSaveQueue() {
  const queueId = $("#editQueueModal").data("queue-id");
  const $button = $(this);
  const $buttonText = $button.find(".button-text");
  const $buttonSpinner = $button.find(".button-spinner");

  // Show loading state
  $buttonText.addClass("d-none");
  $buttonSpinner.removeClass("d-none");
  $button.prop("disabled", true);

  // Prepare form data
  const formData = {
    queueName: $("#editQueueName").val().trim(),
    queueDescription: $("#editQueueDescription").val().trim(),
    queueSeparator: $("#editQueueSeparator").val().trim(),
    silentActions: $("#editSilentActions").is(":checked"),
  };

  // Submit using centralized API
  QueueAPI.updateQueue(queueId, formData)
    .done(function (data) {
      // Hide the modal
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("editQueueModal")
      );
      modal.hide();

      // Reload the page to show updated data
      location.reload();

      // Show success toast
      showToast("success", t("queues.edit_success"));
    })
    .fail(function (xhr) {
      let errorMessage = t("queues.edit_error");
      if (xhr.responseJSON && xhr.responseJSON.error) {
        errorMessage = xhr.responseJSON.error;
      }
      showToast("danger", errorMessage);
    })
    .always(function () {
      // Reset button state
      $buttonText.removeClass("d-none");
      $buttonSpinner.addClass("d-none");
      $button.prop("disabled", false);
    });
}

function handleAddItemKeypress(e) {
  if (e.which === 13) {
    // Enter key
    const $input = $(e.currentTarget);
    const itemName = $input.val().trim();
    if (itemName) {
      const $queueContainer = $input.closest(".queue-items");
      const queueId = $queueContainer.data("queue-id");
      addQueueItem(queueId, itemName, $queueContainer);
    }
  }
}

function handleEditItemKeypress(e) {
  if (e.which === 13 || e.key === "Enter") {
    e.preventDefault();
    e.stopPropagation();

    const $input = $(e.currentTarget);
    const $queueItem = $input.closest(".queue-item-draggable");
    const $priorityCheckbox = $queueItem.find(".priority-checkbox");
    const queueId =
      $input.data("queue-id") ||
      $queueItem.closest(".queue-items").data("queue-id");
    const itemId =
      $input.data("item-id") || $queueItem.closest(".btn-edit").data("item-id");

    const newName = $input.val().trim();
    const newPriority = $priorityCheckbox.is(":checked");
    const originalName = $queueItem.data("original-name");
    const originalPriority = $queueItem.data("original-priority");

    if (
      newName &&
      (newName !== originalName || newPriority !== originalPriority)
    ) {
      updateQueueItem(queueId, itemId, newName, newPriority, $queueItem);
    } else {
      exitEditMode($queueItem, originalName);
    }
  }
}

function handleEscapeKey(e) {
  if (e.which === 27) {
    // Escape key
    const $input = $(e.currentTarget);
    if ($input.hasClass("add-item-field")) {
      const $inputForm = $input.closest(".add-item-input");
      const $addButton = $inputForm.siblings(".btn-add");
      hideAddItemInput($inputForm, $addButton);
    } else if ($input.hasClass("queue-item-input")) {
      const $queueItem = $input.closest(".queue-item-draggable");
      const originalName = $queueItem.data("item-name");
      exitEditMode($queueItem, originalName);
    }
  }
}

// Completed Items Modal Functions
let currentCompletedPage = 1;
let totalCompletedPages = 1;
let currentQueueId = null;

function handleCompletedButtonClick(e) {
  const $button = $(e.currentTarget);
  currentQueueId = $button.data("queue");
  currentCompletedPage = 1;

  // Show the modal
  const modal = new bootstrap.Modal(
    document.getElementById("completedItemsModal")
  );
  modal.show();

  // Load the first page of completed items
  loadCompletedItems(currentQueueId, 1);
}

function loadCompletedItems(queueId, page = 1) {
  const $content = $("#completedItemsContent");

  // Show loading state
  $content.html(`
    <div class="text-center">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">${t("queues.loading")}</span>
      </div>
      <p class="mt-2">${t("queues.loading_completed_items")}</p>
    </div>
  `);

  // Fetch completed items
  QueueAPI.getCompletedItems(queueId, page, 50)
    .done(function (data) {
      displayCompletedItems(data);
      updatePagination(data);
    })
    .fail(function () {
      $content.html(`
        <div class="alert alert-danger text-center">
          <i class="bi bi-exclamation-triangle me-2"></i>
          ${t("queues.fetch_error")}
        </div>
      `);
    });
}

function displayCompletedItems(data) {
  const $content = $("#completedItemsContent");

  if (!data.items || data.items.length === 0) {
    $content.html(`
      <div class="text-center text-muted">
        <i class="bi bi-check-circle fs-1 mb-3"></i>
        <p>${t("queues.no_completed_items")}</p>
      </div>
    `);
    return;
  }

  let html = '<div class="completed-items-list d-flex flex-wrap gap-2">';

  data.items.forEach((item) => {
    html += `
      <div class="completed-item-pill" 
           data-item-id="${item.queueItem_id}">
        <span class="completed-item-text">${escapeHtml(item.itemName)}</span>
        <button class="queue-item-btn btn-remove-completed" 
                data-item-id="${item.queueItem_id}" 
                title="${t("queues.titles.removeItem")}">
          <i class="bi bi-x"></i>
        </button>
      </div>
    `;
  });

  html += "</div>";
  $content.html(html);
}

function updatePagination(data) {
  currentCompletedPage = data.page;
  totalCompletedPages = data.totalPages;

  $("#currentPageSpan").text(currentCompletedPage);
  $("#totalPagesSpan").text(totalCompletedPages);

  // Update button states
  $("#prevPageBtn").prop("disabled", currentCompletedPage <= 1);
  $("#nextPageBtn").prop(
    "disabled",
    currentCompletedPage >= totalCompletedPages
  );
}

function handlePreviousPage() {
  if (currentCompletedPage > 1) {
    loadCompletedItems(currentQueueId, currentCompletedPage - 1);
  }
}

function handleNextPage() {
  if (currentCompletedPage < totalCompletedPages) {
    loadCompletedItems(currentQueueId, currentCompletedPage + 1);
  }
}

function handleRemoveCompletedItem(e) {
  const $button = $(e.currentTarget);
  const itemId = $button.data("item-id");
  const $itemContainer = $button.closest("[data-item-id]");

  // Show confirmation
  if (!confirm(t("queues.confirm_remove_completed"))) {
    return;
  }

  // Add loading state
  $button.prop("disabled", true);
  $button.html('<span class="spinner-border spinner-border-sm"></span>');

  // Remove the item
  QueueAPI.removeCompletedItem(currentQueueId, itemId)
    .done(function () {
      $itemContainer.fadeOut(300, function () {
        $(this).remove();
      });
      showToast("success", t("queues.remove_completed_success"));
    })
    .fail(function () {
      showToast("danger", t("queues.remove_completed_error"));
      // Reset button state
      $button.prop("disabled", false);
      $button.html('<i class="bi bi-x"></i>');
    });
}

function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, function (m) {
    return map[m];
  });
}
