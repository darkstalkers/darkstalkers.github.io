(function(){
  var body = document.body;
  if ( window.innerWidth > 600 ) {
    window.addEventListener('scroll', function(e){
      body.style.backgroundPosition = '50% ' + (- parseInt(window.scrollY / 1.5)) + 'px';
    }, false);
  } else {
    body.style.backgroundSize = 'contain';
  }

  $('.fancybox').fancybox({
    beforeShow: function(){
      var target = $(document.querySelector(this.href)),
          images = target.find('img[data-src]');
      for (var i = 0, n = images.length; i < n; i++ ) {
        var img = images[i];
        if ( !img.src ) {
          img.src = img.getAttribute('data-src');
        }
      }
    }
  });

})();