(function(){
  var main = $('.main');
  main[0].style.cssText = 'display: none';
  setTimeout(function(){
    $('.main').fadeIn(2000);
  }, 500);
})();