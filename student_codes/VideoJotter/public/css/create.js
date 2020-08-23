// PopUp Form and thank you popup after sending message
var $popOverlay = $(".popup-overlay");
var $popWindow = $(".popWindow");
var $subscribeWindow = $(".subscribe_window");
var $popThankYouWindow = $(".thank_you_window");
var $popClose = $(".close-btn");
 
$(function() {
  // Close Pop-Up after clicking on the button "Close"
  $popClose.on("click", function() {
    $popOverlay.fadeOut();
    $popWindow.fadeOut();
  });
 
  // Close Pop-Up after clicking on the Overlay
  //$(document).on("click", function(event) {
//    if ($(event.target).closest($popWindow).length) return;
//    $popOverlay.fadeOut();
//    $popWindow.fadeOut();
//    event.stopPropagation();
//  });
 
  // Form Subscribe
  $(".subscribe-form").submit(function() {
    var th = $(this);
    $.ajax({
      type: "POST",
      url: "mail.php",
      data: th.serialize()
    }).done(function() {
      $popThankYouWindow.fadeIn();
      setTimeout(function() {
        th.trigger("reset");
      }, 1000);
    });
    return false;
  });
});


$('#Button_Create').click(function() {
   $popOverlay.fadeIn();
   $popOverlay.show();
   $subscribeWindow.fadeIn();
   $subscribeWindow.show()
});



