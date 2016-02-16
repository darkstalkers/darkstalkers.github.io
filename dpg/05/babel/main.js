(function(){

  // anchor links
  var body = $('body');
  $(document).on('click', '.gnav a', function(e){
    e.preventDefault();
    var to = $($(this).attr('href')).position().top - 5;
    if ( window.innerWidth < 768 ) {
      to -= 45;
    }
    body.animate({scrollTop: to}, 300);
  });

  // smooth scroll
  // var bg = document.querySelector('bpdy');
  // if ( window.innerWidth > 600 ) {
  //   if ( navigator.userAgent.match(/Chrome\/(46|47|48)/) ) {
  //     bg.style.backgroundAttachment = 'initial';
  //     bg.style.backgroundSize = 'initial';
  //     bg.style.position = 'static';
  //   } else {
  //     bg.addEventListener('scroll', function(e){
  //       bg.style.backgroundPosition = '0 ' + ((- parseInt(bg.scrollTop / 5.5))-200) + 'px';
  //     }, false);
  //   }
  // } else {
  //   bg.style.backgroundSize = 'contain';
  // }

  /* gnav */
  $('#btn_menu').on('click', function () {
    $('.gnav').toggleClass('menu_open');
  });
  $('body').on('click', function(e){
    if ( window.innerWidth > 600 ) {
      if (!e.originalEvent.srcElement.classList.contains('close-ignore')) {
        $('.gnav').removeClass('menu_open');
      }
    } else {
      if (e.originalEvent.srcElement.id !== 'btn_menu') {
        $('.gnav').removeClass('menu_open');
      }
    }
  });

  // Entry list
  $(window).load(function (e) {

    $(".fancybox, .fancybox").fancybox();
    
    // var isDisp = false,
    //     dispBtn = $('#disp');
    // dispBtn.click(function(e){
    //   e.preventDefault();
    //   if ( isDisp ) {
    //     dispBtn.text('エントリーリストを表示する');
    //     isDisp = false;
    //   } else {
    //     dispBtn.text('エントリーリストを非表示にする');
    //     isDisp = true;
    //   }
    //   $('.tab-content').animate({ height: 'toggle' });

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
  // });

})();