(function(){
  // smooth scroll
  var bg = document.querySelector('.container');
  if ( window.innerWidth > 600 ) {
    bg.addEventListener('scroll', function(e){
      bg.style.backgroundPosition = '50% ' + (- parseInt(bg.scrollTop / 2.5)) + 'px';
    }, false);
  } else {
    bg.style.backgroundSize = 'contain';
  }

  // popup window and images lazy load.
  $('.fancybox').fancybox({
    beforeShow: function(){
      var target = $(document.querySelector(this.href)),
          images = target.find('img[data-src]');
      for (var i = 0, n = images.length; i < n; i++ ) {
        var img = images[i];
        img.src = img.getAttribute('data-src');
      }
    }
  });

})();