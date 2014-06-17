(function(){
  var width = $(window).width();
  var left = Math.floor(width / 2);
  var top  = Math.floor($(window).height() / 2);

  $('.container').width(width);

  var main = $('.main');
  main[0].style.cssText = 'display: none';
  setTimeout(function(){
    ripple(left, top);
    $('.main').fadeIn(2500, function(){
      $('.social').animate({
          height: 'toggle',
          display: 'block'
        },
        'slow'
      );
    });
  }, 500);

  $(document.body).bind("click",function(e) {
    ripple(e.pageX, e.pageY);
  });

  function ripple(x, y){
    new Ripple({
        target: ".container",
        x: x,
        y: y,
        size: width-10,
        count: 1,
        width: 1,
        color: "rgb(204, 48, 48)",
        zIndex: 30,
        shadow: '0 0 6px rgb(204, 48, 48)',
        duration: 2000
    });
  }
})();