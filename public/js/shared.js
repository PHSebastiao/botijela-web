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

$(function () {
  var $toastElements = $(".toast");
  if ($toastElements.length) {
    $toastElements.each(function(index, element) {
      var toast = new bootstrap.Toast(element, { 
        delay: 4000,
        autohide: true
      });
      
      // Stagger the display slightly for multiple toasts
      setTimeout(function() {
        toast.show();
      }, index * 200);
    });
  }
});

const tooltipTriggerList = document.querySelectorAll(
  '[data-bs-toggle="tooltip"]'
);
const tooltipList = [...tooltipTriggerList].map(
  (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl)
);

// Add slideDown animation to Bootstrap dropdown when expanding.
$(".dropdown").on("show.bs.dropdown", function () {
  $(this).find(".dropdown-menu").first().slideToggle(300);
});

// Add slideUp animation to Bootstrap dropdown when collapsing.
$(".dropdown").on("hide.bs.dropdown", function () {
  $(this).find(".dropdown-menu").first().slideToggle(300);
});

$(".dropup").on("show.bs.dropdown", function () {
  $(this).find(".dropdown-menu").first().slideToggle(300);
});

$(".dropup").on("hide.bs.dropdown", function () {
  $(this).find(".dropdown-menu").first().stop(100, 100).slideDown(300);
});
