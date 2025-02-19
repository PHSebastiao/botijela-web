function toggleSidebar() {
  $("#sidebar").toggleClass("collapsed");
  $("#content").toggleClass("shift");
  $("#sidebarCollapse").toggleClass("shift");
  $("#themeToggle").toggleClass("shift");
}

$("#sidebarCollapse").on("click", toggleSidebar);