// anchor links
$(document).on('click', 'a.list-group-item', function(e){
  e.preventDefault();
  var to = $($(this).attr('href')).position().top - 25;
  $('body').animate({scrollTop: to}, 300);
});