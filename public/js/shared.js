function setCookie(name, value, days) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

// Get session ID from cookie or generate one
function getSessionId() {
  let sessionId = getCookie("socket_session_id");
  if (!sessionId) {
    sessionId =
      "session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    setCookie("socket_session_id", sessionId, 30); // 30 days
  }
  return sessionId;
}

// Cookie utilities
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-bs-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-bs-theme", newTheme);
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

// Translation helper function
function t(key) {
  return window.translations[key] || key;
}

function showToast(type, message) {
  const toastId = Date.now() + Math.random();
  const toastHtml = `
                <div class="toast align-items-center text-bg-${type} border-0 mb-2" role="alert" 
                     aria-live="assertive" aria-atomic="true" data-toast-id="${toastId}">
                    <div class="d-flex">
                        <div class="toast-body">${message}</div>
                        <button type="button" class="btn-close btn-close-white me-2 m-auto" 
                                data-bs-dismiss="toast" aria-label="Close"></button>
                    </div>
                </div>
            `;

  let toastContainer = $(".toast-container");
  if (toastContainer.length === 0) {
    toastContainer = $(
      '<div class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index: 1100;"></div>'
    );
    $("body").append(toastContainer);
  }

  const $toast = $(toastHtml);
  toastContainer.append($toast);

  const toast = new bootstrap.Toast($toast[0], {
    delay: 4000,
    autohide: true,
  });
  toast.show();
}

$(function () {
  var $toastElements = $(".toast");
  if ($toastElements.length) {
    $toastElements.each(function (index, element) {
      var toast = new bootstrap.Toast(element, {
        delay: 4000,
        autohide: true,
      });

      // Stagger the display slightly for multiple toasts
      setTimeout(function () {
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
