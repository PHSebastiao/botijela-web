function toggleSidebar() {
  $("#sidebar").toggleClass("collapsed");
  $("#content").toggleClass("shift");
}

$("#sidebarCollapse").on("click", toggleSidebar);

$(document).on("click", ".select-managing", function (e) {
  e.preventDefault();
  const username = $(this).data("username");
  document.cookie = `managing=${username};path=/;SameSite=Lax`;
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
  });
  location.reload();
});
