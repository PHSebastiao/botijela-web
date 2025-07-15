// Queue UI Helpers
// Handles UI interactions, event delegation, and DOM manipulation

class QueueUIHelpers {
  constructor() {
    this.isHoverHandlerInitialized = false;
    this.currentCompletedPage = 1;
    this.totalCompletedPages = 1;
    this.currentQueueId = null;
  }

  // Initialize all UI components
  initialize() {
    this.initializeEventDelegation();
    this.initializeTooltips();
    this.initializeHoverEffects();
  }

  // Cached jQuery selectors for performance
  get $cached() {
    if (!this._cached) {
      this._cached = {
        document: $(document),
        body: $("body"),
        listGroup: null,
        queueItems: null,

        // Update cache when DOM changes
        updateCache() {
          this.listGroup = $(".list-group");
          this.queueItems = $(".queue-items");
        },

        // Get cached or fresh selector
        get(selector) {
          return $(selector);
        },
      };
      this._cached.updateCache();
    }
    return this._cached;
  }

  // Event delegation for better performance
  initializeEventDelegation() {
    this.$cached.document
      // Queue item actions
      .on("click", ".queue-item-btn.btn-edit", (e) => this.handleEditItem(e))
      .on("click", ".queue-item-btn.btn-delete", (e) =>
        this.handleDeleteItem(e)
      )
      .on("click", ".queue-item-btn.btn-complete", (e) =>
        this.handleCompleteItem(e)
      )
      .on("click", ".queue-item-btn.btn-add", (e) => this.handleAddItem(e))
      .on("click", ".queue-item-btn.btn-send", (e) => this.handleSendItem(e))
      .on("click", ".add-item-cancel", (e) => this.handleCancelAdd(e))

      // Queue actions
      .on("click", ".btn-delete-queue", (e) => this.handleDeleteQueue(e))
      .on("click", ".btn-edit-queue", (e) => this.handleEditQueue(e))
      .on("click", ".btn-completed", (e) => this.handleCompletedButtonClick(e))

      // Modal actions
      .on("click", "#confirmDeleteQueue", () => this.handleConfirmDelete())
      .on("click", "#saveQueueChanges", (e) => this.handleSaveQueue(e))
      .on("click", "#prevPageBtn", () => this.handlePreviousPage())
      .on("click", "#nextPageBtn", () => this.handleNextPage())
      .on("click", ".btn-remove-completed", (e) =>
        this.handleRemoveCompletedItem(e)
      )

      // Form submissions
      .on("keypress", ".add-item-field", (e) => this.handleAddItemKeypress(e))
      .on("keypress", ".queue-item-input", (e) =>
        this.handleEditItemKeypress(e)
      )
      .on("keydown", ".queue-item-input", (e) => {
        if (e.which === 13 || e.key === "Enter") {
          e.preventDefault();
          e.stopPropagation();
          this.handleEditItemKeypress(e);
        }
      })
      .on("keyup", ".add-item-field, .queue-item-input", (e) =>
        this.handleEscapeKey(e)
      )

      // Click outside to collapse items
      .on("click.queueItems", (e) => this.handleClickOutside(e));
  }

  // Optimized hover effects using event delegation
  initializeHoverEffects() {
    if (this.isHoverHandlerInitialized) return;

    this.$cached.document.on(
      "mouseenter.queueHover",
      ".queue-item-draggable",
      (e) => {
        const $this = $(e.currentTarget);

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
          .appendTo(this.$cached.body);

        const naturalWidth = $clone.outerWidth();
        $clone.remove();

        // Set the calculated width and add expanded class
        $this.css("width", naturalWidth + "px").addClass("expanded");
      }
    );

    this.isHoverHandlerInitialized = true;
  }

  // Initialize tooltips with accessibility improvements
  initializeTooltips() {
    $('[data-bs-toggle="tooltip"]').tooltip();

    // Add accessibility enhancements
    $(".queue-item-btn.btn-edit").attr(
      "aria-label",
      t("queues.titles.editItem")
    );
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
    this.$cached.document.on("keydown", ".queue-item-draggable", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        $(e.currentTarget).find(".btn-edit").click();
      }
    });
  }

  // Initialize sortable functionality
  initializeSortable() {
    $(".queue-items").each((index, element) => {
      const $element = $(element);
      const queueId = $element.data("queue-id");

      if (!queueId) return;

      $element.sortable({
        handle: ".drag-handle",
        animation: 150,
        ghostClass: "sortable-ghost",
        dragClass: "sortable-drag",
        onEnd: (evt) => {
          const itemId = $(evt.item).data("item-id");
          if (evt.newIndex == evt.oldIndex) return;
          const newPosition = evt.newIndex + 1;

          const $queueContainer = $(`.queue-items[data-queue-id='${queueId}']`);
          $queueContainer.wrapLoading(
            window.QueueAPI.reorderItems(queueId, {
              itemId: itemId,
              newPosition: newPosition,
            })
              .done(() => {
                $queueContainer.forceCleanupLoading();
                this.initializeHoverEffects();
              })
              .fail(() => {
                if (typeof window.refreshQueueList === "function") {
                  window.refreshQueueList();
                }
              })
          );
        },
      });
    });
  }

  // Event handlers
  handleEditItem(e) {
    e.preventDefault();
    e.stopPropagation();

    const $button = $(e.currentTarget);
    const $queueItem = $button.closest(".queue-item-draggable");
    const $queueContainer = $button.closest(".queue-items");
    const queueId = $queueContainer.data("queue-id");
    const itemId = $button.data("item-id");

    if ($queueItem.hasClass("editing")) {
      return;
    }

    this.showEditItemInput($queueItem, queueId, itemId);
  }

  handleDeleteItem(e) {
    e.preventDefault();
    e.stopPropagation();

    const $button = $(e.currentTarget);
    const $queueContainer = $button.closest(".queue-items");
    const $queueItem = $button.closest(".queue-item-draggable");
    const queueId = $queueContainer.data("queue-id");
    const itemId = $button.data("item-id");

    $queueContainer.wrapLoading(
      window.QueueAPI.deleteItem(queueId, itemId)
        .done((data) => {
          $queueItem.remove();
          $queueContainer.forceCleanupLoading();
        })
    );
  }

  handleCompleteItem(e) {
    e.preventDefault();
    e.stopPropagation();

    const $button = $(e.currentTarget);
    const $queueContainer = $button.closest(".queue-items");
    const $queueItem = $button.closest(".queue-item-draggable");
    const queueId = $queueContainer.data("queue-id");
    const itemId = $button.data("item-id");

    $queueContainer.wrapLoading(
      window.QueueAPI.completeItem(queueId, itemId)
        .done((data) => {
          $queueItem.remove();
          $queueContainer.forceCleanupLoading();
        })
    );
  }

  handleAddItem(e) {
    e.preventDefault();
    e.stopPropagation();

    const $button = $(e.currentTarget);
    const $queueContainer = $button.closest(".queue-items");
    const queueId = $queueContainer.data("queue-id");

    if ($queueContainer.find(".add-item-input").length > 0) {
      return;
    }

    this.showAddItemInput($queueContainer, queueId);
  }

  handleSendItem(e) {
    e.preventDefault();
    e.stopPropagation();

    const $button = $(e.currentTarget);
    const $queueContainer = $button.closest(".queue-items");
    const queueId = $queueContainer.data("queue-id");

    // Check if this is an add operation
    const $addInput = $queueContainer.find(".add-item-field");
    if ($addInput.length > 0) {
      const itemName = $addInput.val().trim();
      if (itemName) {
        this.addQueueItem(queueId, itemName, $queueContainer);
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
        this.updateQueueItem(queueId, itemId, newName, newPriority, $queueItem);
      } else {
        this.exitEditMode($queueItem, originalName);
      }
    }
  }

  handleCancelAdd(e) {
    const $button = $(e.currentTarget);
    const $inputForm = $button.closest(".add-item-input");
    const $addButton = $inputForm.siblings(".btn-add");
    this.hideAddItemInput($inputForm, $addButton);
  }

  handleClickOutside(e) {
    // Hide all tooltips
    $(".tooltip").remove();

    if (!$(e.target).closest(".queue-item-draggable").length) {
      $(".queue-item-draggable").removeClass("expanded").css("width", "120px");
    }
  }

  // UI manipulation methods
  showAddItemInput($queueContainer, queueId) {
    const $inputForm = $(QueueTemplates.createAddItemInput());
    const $addButton = $queueContainer.find(".btn-add");

    $addButton.before($inputForm);
    $addButton.removeClass("btn-add").addClass("btn-send");
    $addButton.html('<i class="bi bi-send"></i>');
    $addButton.attr("title", t("queues.save_item"));

    let tooltip = new bootstrap.Tooltip($inputForm.find(".add-item-field"));

    setTimeout(() => {
      $inputForm.css({
        opacity: "1",
        transform: "translateY(0)",
      });
    }, 10);

    const $input = $inputForm.find("input");
    setTimeout(() => $input.trigger("focus"), 300);

    $inputForm.find(".add-item-cancel").on("click", () => {
      this.hideAddItemInput($inputForm, $addButton);
    });
  }

  hideAddItemInput($inputForm, $addButton) {
    $inputForm.css({
      opacity: "0",
      transform: "translateY(-10px)",
    });

    $addButton.removeClass("btn-send").addClass("btn-add");
    $addButton.html('<i class="bi bi-plus-lg"></i>');
    $addButton.attr("title", t("queues.add_item"));

    setTimeout(() => {
      $inputForm.remove();
    }, 300);
  }

  showEditItemInput($queueItem, queueId, itemId) {
    $queueItem.addClass("editing");

    const $itemText = $queueItem.find(".queue-item-text");
    const $editButton = $queueItem.find(".btn-edit");
    const currentName = $itemText.text();
    const isPriority = $queueItem.hasClass("priority-item");

    $itemText.replaceWith(
      QueueTemplates.createEditInput(currentName, isPriority, queueId, itemId)
    );

    $editButton.removeClass("btn-edit").addClass("btn-send");
    $editButton.html('<i class="bi bi-send"></i>');
    $editButton.attr("title", t("queues.save_item"));

    const $input = $queueItem.find(".queue-item-input");
    requestAnimationFrame(() => {
      $input.focus().select();
    });

    $queueItem.data("original-name", currentName);
    $queueItem.data("original-priority", isPriority);

    $(document).on("click.editItem", (e) => {
      if (!$(e.target).closest(".queue-item-draggable.editing").length) {
        this.exitEditMode($queueItem, currentName);
      }
    });
  }

  exitEditMode($queueItem, originalName) {
    $queueItem.removeClass("editing");

    const $inputContainer = $queueItem.find(".d-flex.align-items-center.gap-2");
    const $sendButton = $queueItem.find(".btn-send");

    $inputContainer.replaceWith(
      `<span class="queue-item-text">${originalName}</span>`
    );

    $sendButton.removeClass("btn-send").addClass("btn-edit");
    $sendButton.html('<i class="bi bi-pencil"></i>');
    $sendButton.attr("title", t("queues.titles.editItem"));

    $(document).off("click.editItem");
  }

  // Rebuild queue items after API calls
  rebuildQueueItems($queueContainer, data, queueId) {
    $queueContainer.forceCleanupLoading();
    $queueContainer.html("");

    if (data.count > 0) {
      data.items.forEach((queueItem) => {
        $queueContainer.append(QueueTemplates.createQueueItem(queueItem));
      });
    }

    $queueContainer.append(QueueTemplates.createAddButton());
    this.initializeSortable();
    this.initializeHoverEffects();
  }

  // Re-render entire queue list
  reRenderQueues(queues) {
    const $template = $(`<ul class="list-group"></ul>`);
    if (queues.count > 0) {
      queues.items.forEach((queue) => {
        $template.append(QueueTemplates.createQueueListItem(queue));
      });
    } else {
      $("main").append(t("queues.no_queues"));
    }

    this.$cached.listGroup.replaceWith($template);
    this.$cached.updateCache();

    this.initializeSortable();
    this.initializeHoverEffects();
  }

  // Keyboard event handlers
  handleAddItemKeypress(e) {
    if (e.which === 13) {
      const $input = $(e.currentTarget);
      const itemName = $input.val().trim();
      if (itemName) {
        const $queueContainer = $input.closest(".queue-items");
        const queueId = $queueContainer.data("queue-id");
        this.addQueueItem(queueId, itemName, $queueContainer);
      }
    }
  }

  handleEditItemKeypress(e) {
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
        $input.data("item-id") || $queueItem.find(".btn-edit").data("item-id");

      const newName = $input.val().trim();
      const newPriority = $priorityCheckbox.is(":checked");
      const originalName = $queueItem.data("original-name");
      const originalPriority = $queueItem.data("original-priority");

      if (
        newName &&
        (newName !== originalName || newPriority !== originalPriority)
      ) {
        this.updateQueueItem(queueId, itemId, newName, newPriority, $queueItem);
      } else {
        this.exitEditMode($queueItem, originalName);
      }
    }
  }

  handleEscapeKey(e) {
    if (e.which === 27) {
      const $input = $(e.currentTarget);
      if ($input.hasClass("add-item-field")) {
        const $inputForm = $input.closest(".add-item-input");
        const $addButton = $inputForm.siblings(".btn-add");
        this.hideAddItemInput($inputForm, $addButton);
      } else if ($input.hasClass("queue-item-input")) {
        const $queueItem = $input.closest(".queue-item-draggable");
        const originalName = $queueItem.data("original-name");
        this.exitEditMode($queueItem, originalName);
      }
    }
  }

  // API operations with UI updates
  addQueueItem(queueId, itemName, $queueContainer) {
    const $inputForm = $queueContainer.find(".add-item-input");
    const $sendButton = $queueContainer.find(".btn-send");

    $inputForm.find("input, button").prop("disabled", true);
    $sendButton
      .prop("disabled", true)
      .html('<span class="spinner-border spinner-border-sm"></span>');

    $queueContainer.wrapLoading(
      window.QueueAPI.addItem(queueId, { itemName: itemName })
        .done((data) => {
          this.rebuildQueueItems($queueContainer, data, queueId);
        })
        .fail((xhr) => {
          $inputForm.find("input, button").prop("disabled", false);
          $sendButton
            .prop("disabled", false)
            .html('<i class="bi bi-send"></i>');

          $inputForm.find("input").focus();
        })
    );
  }

  updateQueueItem(queueId, itemId, newName, isPriority, $queueItem) {
    const $queueContainer = $queueItem.closest(".queue-items");
    const $input = $queueItem.find(".queue-item-input");
    const $priorityCheckbox = $queueItem.find(".priority-checkbox");
    const $sendButton = $queueItem.find(".btn-send");

    $input.prop("disabled", true);
    $priorityCheckbox.prop("disabled", true);
    $sendButton
      .prop("disabled", true)
      .html('<span class="spinner-border spinner-border-sm"></span>');

    $queueContainer.wrapLoading(
      window.QueueAPI.updateItem(queueId, itemId, {
        itemName: newName,
        isPriority: isPriority,
      })
        .done((data) => {
          this.rebuildQueueItems($queueContainer, data, queueId);
        })
        .fail((xhr) => {
          $input.prop("disabled", false);
          $priorityCheckbox.prop("disabled", false);
          $sendButton
            .prop("disabled", false)
            .html('<i class="bi bi-send"></i>');

          $input.focus().select();
        })
    );
  }

  // Completed items modal functionality
  handleCompletedButtonClick(e) {
    const $button = $(e.currentTarget);
    this.currentQueueId = $button.data("queue");
    this.currentCompletedPage = 1;

    const modal = new bootstrap.Modal(
      document.getElementById("completedItemsModal")
    );
    modal.show();

    this.loadCompletedItems(this.currentQueueId, 1);
  }

  loadCompletedItems(queueId, page = 1) {
    const $content = $("#completedItemsContent");

    $content.html(`
      <div class="text-center">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">${t("queues.loading")}</span>
        </div>
        <p class="mt-2">${t("queues.loading_completed_items")}</p>
      </div>
    `);

    window.QueueAPI.getCompletedItems(queueId, page, 50)
      .done((data) => {
        this.displayCompletedItems(data);
        this.updatePagination(data);
      })
      .fail(() => {
        $content.html(`
          <div class="alert alert-danger text-center">
            <i class="bi bi-exclamation-triangle me-2"></i>
            ${t("queues.fetch_error")}
          </div>
        `);
      });
  }

  displayCompletedItems(data) {
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
        <div class="completed-item-pill" data-item-id="${item.queueItem_id}">
          <span class="completed-item-text">${this.escapeHtml(
            item.itemName
          )}</span>
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

  updatePagination(data) {
    this.currentCompletedPage = data.page;
    this.totalCompletedPages = data.totalPages;

    $("#currentPageSpan").text(this.currentCompletedPage);
    $("#totalPagesSpan").text(this.totalCompletedPages);

    $("#prevPageBtn").prop("disabled", this.currentCompletedPage <= 1);
    $("#nextPageBtn").prop(
      "disabled",
      this.currentCompletedPage >= this.totalCompletedPages
    );
  }

  handlePreviousPage() {
    if (this.currentCompletedPage > 1) {
      this.loadCompletedItems(
        this.currentQueueId,
        this.currentCompletedPage - 1
      );
    }
  }

  handleNextPage() {
    if (this.currentCompletedPage < this.totalCompletedPages) {
      this.loadCompletedItems(
        this.currentQueueId,
        this.currentCompletedPage + 1
      );
    }
  }

  handleRemoveCompletedItem(e) {
    const $button = $(e.currentTarget);
    const itemId = $button.data("item-id");
    const $itemContainer = $button.closest("[data-item-id]");

    if (!confirm(t("queues.confirm_remove_completed"))) {
      return;
    }

    $button.prop("disabled", true);
    $button.html('<span class="spinner-border spinner-border-sm"></span>');
    window.QueueAPI.removeCompletedItem(this.currentQueueId, itemId)
      .done(() => {
        $itemContainer.fadeOut(300, function () {
          $(this).remove();
        });
      })
      .fail(() => {
        $button.prop("disabled", false);
        $button.html('<i class="bi bi-x"></i>');
      });
  }

  // Utility methods
  escapeHtml(text) {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  // Additional handler methods for queue management
  handleDeleteQueue(e) {
    e.preventDefault();
    const $button = $(e.currentTarget);
    const data = $button.data("queue");
    const $queueItem = $button.closest(".list-group");
    const queueName = $queueItem.find("h3").text();

    $("#queueNameToDelete").text(queueName);
    $("#deleteQueueModal").data("queue-data", data);
    $("#deleteQueueModal").data("queue-item", $queueItem);

    const modal = new bootstrap.Modal(
      document.getElementById("deleteQueueModal")
    );
    modal.show();
  }

  handleConfirmDelete() {
    const data = $("#deleteQueueModal").data("queue-data");
    const $queueItem = $("#deleteQueueModal").data("queue-item");

    const modal = bootstrap.Modal.getInstance(
      document.getElementById("deleteQueueModal")
    );
    modal.hide();

    $queueItem.wrapLoading(
      window.QueueAPI.deleteQueue(data.channelId, data.queueId)
    );
  }

  handleEditQueue(e) {
    e.preventDefault();
    const $button = $(e.currentTarget);
    const queueId = $button.data("queue");

    $button
      .prop("disabled", true)
      .html('<span class="spinner-border spinner-border-sm"></span>');

    window.QueueAPI.getQueue(queueId)
      .done((data) => {
        $("#editQueueName").val(data[0].queueName);
        $("#editQueueDescription").val(data[0].queueDescription);
        $("#editQueueSeparator").val(data[0].queueSeparator);
        $("#editSilentActions").prop("checked", data[0].silentActions);
        $("#editQueueModal").data("queue-id", queueId);

        const modal = new bootstrap.Modal(
          document.getElementById("editQueueModal")
        );
        modal.show();
      })
      .always(() => {
        $button
          .prop("disabled", false)
          .html('<i class="bi bi-pencil-square"></i>');
      });
  }

  handleSaveQueue(e) {
    const queueId = $("#editQueueModal").data("queue-id");
    const $button = $(e.currentTarget);
    const $buttonText = $button.find(".button-text");
    const $buttonSpinner = $button.find(".button-spinner");

    $buttonText.addClass("d-none");
    $buttonSpinner.removeClass("d-none");
    $button.prop("disabled", true);

    const formData = {
      queueName: $("#editQueueName").val().trim(),
      queueDescription: $("#editQueueDescription").val().trim(),
      queueSeparator: $("#editQueueSeparator").val().trim(),
      silentActions: $("#editSilentActions").is(":checked"),
    };

    window.QueueAPI.updateQueue(queueId, formData)
      .done(() => {
        const modal = bootstrap.Modal.getInstance(
          document.getElementById("editQueueModal")
        );
        modal.hide();
      })
      .always(() => {
        $buttonText.removeClass("d-none");
        $buttonSpinner.addClass("d-none");
        $button.prop("disabled", false);
      });
  }
}

// Global UI helpers instance
window.queueUIHelpers = new QueueUIHelpers();

// Expose key functions globally for backward compatibility
window.refreshQueueList = () => {
  if (
    !window.queueUIHelpers.$cached.listGroup ||
    window.queueUIHelpers.$cached.listGroup.length === 0
  ) {
    window.queueUIHelpers.$cached.updateCache();
  }

  window.queueUIHelpers.$cached.listGroup.wrapLoading(
    window.QueueAPI.getQueues().done((data) => {
      window.queueUIHelpers.reRenderQueues(data);
    })
  );
};

window.refreshQueueItems = (queueId) => {
  const $queueContainer = $(`.queue-items[data-queue-id='${queueId}']`);
  if ($queueContainer.length === 0) return;

  $queueContainer.wrapLoading(
    window.QueueAPI.getQueue(queueId).done((data) => {
      if (data.length == 1) {
        window.queueUIHelpers.rebuildQueueItems(
          $queueContainer,
          { count: data[0].items.length, items: data[0].items },
          queueId
        );
      }
    })
  );
};
