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
  const body = document.body;
  const currentTheme = body.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-bs-theme", newTheme);
  body.setAttribute("data-theme", newTheme);
  setCookie("theme", newTheme, 30);
  $(this).find("i").toggleClass("bi-moon bi-sun");
}

$("#themeToggle").on("click", toggleTheme);

$(document).on("click", ".lang-switch", function (e) {
  e.preventDefault();
  var lang = $(this).data("lang");
  document.cookie = "i18next=" + lang + ";path=/;SameSite=Lax";
  location.reload();
});
