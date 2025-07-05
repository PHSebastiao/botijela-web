$(".btn-completed").on("click", (e) => {
  e.preventDefault();
  let queueId = $(this).data("queue");
});

$(".btn-edit").on("click", (e) => {
  e.preventDefault();
  let queueId = $(this).data("queue");
});

$(".btn-delete").on("click", function (e) {
  e.preventDefault();
  let queueId = $(this).data("queue");
  $.ajax({
    url: `/queue/${queueId}`,
    type: "DELETE",
  });
});

