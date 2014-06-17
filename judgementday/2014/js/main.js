(function(){
  var width = $(window).width();
  var left = Math.floor(width / 2);
  var top  = Math.floor($(window).height() / 2);

  var main = $('.main');
  main[0].style.cssText = 'display: none';
  setTimeout(function(){
    ripple(left, top);
    $('.main').fadeIn(2500);
  }, 500);



  $(document.body).bind("click",function(e) {
    ripple(e.pageX, e.pageY);
  });
  function ripple(x, y){
    new Ripple({
        x: x,
        y: y,
        size: width,
        count: 1,
        width: 1,
        color: "rgba(255,0,0,0.5)",
        zIndex: 30,
        shadow: '0 0 6px red',
        duration: 2000
    });
  }
})();