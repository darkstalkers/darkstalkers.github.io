(function(){

  // anchor links
  var con = $('.container');
  $(document).on('click', 'a.list-group-item', function(e){
    e.preventDefault();
    var to = $($(this).attr('href')).position().top + con.scrollTop() - 60;
    con.animate({scrollTop: to}, 300);
  });

  // smooth scroll
  var bg = document.querySelector('.container');
  if ( window.innerWidth > 600 ) {
    bg.addEventListener('scroll', function(e){
      bg.style.backgroundPosition = '50% ' + (- parseInt(bg.scrollTop / 2.5)) + 'px';
    }, false);
  } else {
    bg.style.backgroundSize = 'contain';
  }

  // Entry list
  $(window).load(function (e) {

    $(".fancybox, .fancybox").fancybox();
    
    var isDisp = false,
        dispBtn = $('#disp');
    dispBtn.click(function(e){
      e.preventDefault();
      if ( isDisp ) {
        dispBtn.text('エントリーリストを表示する');
        isDisp = false;
      } else {
        dispBtn.text('エントリーリストを非表示にする');
        isDisp = true;
      }
      $('.tab-content').animate({ height: 'toggle' });
      
    });


    // order asc
    // savior.trio = savior.trio.reverse();
    // savior.pair = savior.pair.reverse();
    // savior.solo = savior.solo.reverse();

    // $('#savior .loading').hide();

    // trio
    // $('#savior-entry-list-item').tmpl(savior.trio).appendTo('#savior-entry-list > ul');

    // pair
    // if ( savior.pair.length !== 0 ) {
    //   $('#savior-entry-list-item').tmpl(savior.pair).appendTo('#savior-entry-pair > ul');
    // } else {
    //   $('#savior-entry-pair').parent().hide();
    // }

    // solo
    // $('#savior-entry-list-item').tmpl(savior.solo).appendTo('#savior-entry-solo > ul');

    // free
    // if ( savior.free.length !== 0 ) {
    //   $('#savior-entry-single-tmpl').tmpl(savior.free).appendTo('#savior-entry-single > ul');
    // } else {
    //   $('#savior-entry-single').parent().hide();
    // }
  });

})();