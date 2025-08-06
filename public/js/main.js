function toggleSidebar() {
  $("#sidebar").toggleClass("collapsed");
  $("#content").toggleClass("shift");
}

$("#sidebarCollapse").on("click", toggleSidebar);

$(document).on("click", ".select-managing", function (e) {
  e.preventDefault();
  const username = $(this).data("username");
  document.cookie = `managing=${username};path=/;SameSite=Lax`;

  // Switch socket connection to new channel if socket manager is available
  if (window.socketManager && typeof switchToChannel === "function") {
    switchToChannel(username);
  }

  location.reload();
});
$(document).on("click", ".manage-self", function (e) {
  e.preventDefault();
  document.cookie = `managing=;path=/;SameSite=Lax`;
  location.reload();
});
$(document).on("click", "#joinChannel", function (e) {
  e.preventDefault();
  $.ajax({
    url: `/join`,
    type: "POST",
    success: function (data) {
      location.reload();
    },
    error: function (xhr, status, error) {
      location.reload();
    },
  });
});

// $(document).on("click", "#channelToManage", function (e) {
//   refreshManageableChannels();
// });

function refreshManageableChannels() {
  $.ajax({
    url: `/api/manageable`,
    type: "GET",
    success: function (data) {
      updateManageableDropdown(data.manageable);
    },
    error: function (xhr, status, error) {
      console.error("Error refreshing manageable channels:", error);
    },
  });
}

function updateManageableDropdown(manageable) {
  const $dropdown = $("#channelToManage").next(".dropdown-menu");
  const $manageableSection = $dropdown
    .find(".dropdown-header")
    .parent()
    .nextUntil(".dropdown-divider")
    .addBack();

  // Remove existing manageable items (everything between header and divider)
  $manageableSection.remove();

  if (manageable && manageable.length > 0) {
    // Create new manageable items
    let manageableHtml = `
      <li>
        <h6 class="dropdown-header">${t("main.moderated_channels")}:</h6>
      </li>
    `;

    manageable.forEach((channel) => {
      manageableHtml += `
        <li>
          <a href="#" class="dropdown-item select-managing" data-username="${
            channel.name
          }">
            <img class="dropdown-pfp rounded-circle" 
                 src="${channel.profilePictureUrl}" 
                 alt="${channel.name}'s Profile Picture"
                 ${channel.isLive ? 'style="border-color: red;"' : ""}>
            ${channel.name}
          </a>
        </li>
      `;
    });

    manageableHtml += `
      <li>
        <hr class="dropdown-divider">
      </li>
      <li><a class="dropdown-item log-out" href="/logout">Logout</a></li>
    `;

    // Insert before the logout item
    $dropdown.html(manageableHtml);
  }
}
