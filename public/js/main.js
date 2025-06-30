function toggleSidebar() {
  $("#sidebar").toggleClass("collapsed");
  $("#content").toggleClass("shift");
}

$("#sidebarCollapse").on("click", toggleSidebar);