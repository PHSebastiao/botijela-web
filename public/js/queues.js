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
        const newPosition = evt.newIndex;

        // Send API request to update order
        $.ajax({
          url: `/queue/${queueId}/reorder`,
          type: "PUT",
          contentType: "application/json",
          data: JSON.stringify({ itemId: itemId, newPosition: newPosition }),
          success: function (response) {
            showToast("success", t("queues.reorder_success"));
          },
          error: function () {
            showToast("danger", t("queues.reorder_error"));
            // Revert the visual change by recreating the sortable
            location.reload();
          },
        });
      },
    });
  });
}

function bindEventHandlers() {
  $(".btn-completed")
    .off("click")
    .on("click", (e) => {
      e.preventDefault();
      let queueId = $(this).data("queue");
    });

  $(".btn-edit")
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
      let itemId = $(this).data("item-id");
      let queueId = $(this).parents(".queue-item")[0].data("queue-id")
      // TODO: Implement item edit functionality
      console.log("Edit item:", itemId);
    });

  // Item-level delete buttons
  $(".queue-item-btn.btn-delete")
    .off("click")
    .on("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      let itemId = $(this).data("item-id");
      let queueId = $(this).parents(".queue-item")[0].data("queue-id")
      // TODO: Implement item delete functionality
      console.log("Delete item:", itemId);
    });

  // Item-level add buttons
  $(".queue-item-btn.btn-add")
    .off("click")
    .on("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      let queueId = $(this).parents(".queue-item")[0].data("queue-id")
      // TODO: Implement item add functionality
      console.log("Add item:");
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
      if (!$(e.target).closest(".queue-item-draggable").length) {
        $(".queue-item-draggable")
          .removeClass("expanded")
          .css("width", "120px");
      }
    });

  $(".btn-delete")
    .off("click")
    .on("click", function (e) {
      e.preventDefault();
      let data = $(this).data("queue");
      $.ajax({
        url: `/queue/${data.channelId}/${data.queueId}`,
        type: "DELETE",
        success: function (data) {
          var $template = $(`<ul class="list-group"></ul>`);
          if (data.count > 0) {
            data.items.forEach((queue) => {
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
                    ${t("queues.command")}: ${queue.prefix || "!"}${
                queue.queueName
              }
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
                  <button type="button" class="btn-edit btn btn-sm btn-outline-warning border-0 me-1"
                    data-queue="${
                      queue.queueConfig_id
                    }" data-bs-toggle="tooltip" data-bs-placement="left"
                    data-bs-title="${t("queues.titles.edit")}">
                    <i class="bi bi-pencil-square"></i>
                  </button>
                  <button type="button" class="btn-delete btn btn-sm btn-outline-danger border-0"
                    data-queue='{"queueId": ${
                      queue.queueConfig_id
                    }, "channelId": ${
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

          // Show success toast
          showToast("success", t("queues.delete_success"));
        },
        error: function () {
          // Show error toast
          showToast("danger", t("queues.delete_error"));
        },
      });
    });
}

// Initialize event handlers on page load
$(function () {
  bindEventHandlers();
  initializeSortable();
});
