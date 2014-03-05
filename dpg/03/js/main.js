(function(){
  var body = document.body;
  if ( window.innerWidth > 600 ) {
    window.addEventListener('scroll', function(e){
      body.style.backgroundPosition = '50% ' + (- parseInt(window.scrollY / 1.5)) + 'px';
    }, false);
  } else {
    // body.style.backgroundAttachment = 'fixed';
  }

  $('.fancybox').fancybox({
    beforeShow: function(){
      // 
    }
  });

})();