function setCookie(name, value, days) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function toggleTheme() {
  if (document.documentElement.getAttribute("data-bs-theme") == "dark") {
    document.documentElement.setAttribute("data-bs-theme", "light");
  } else {
    document.documentElement.setAttribute("data-bs-theme", "dark");
  }
  const newTheme = document.documentElement.getAttribute("data-bs-theme");
  setCookie("theme", newTheme, 30);
  $(this).find("i").toggleClass("bi-moon bi-sun");
  $("#sidebarCollapse, #themeToggle, #returnHome").toggleClass(
    "btn-outline-light btn-outline-dark"
  );
}

$("#themeToggle").on("click", toggleTheme);