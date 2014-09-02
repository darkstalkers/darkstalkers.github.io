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
    $('#savior .loading').hide();
    $('#savior-entry-list-item').tmpl(savior.data).appendTo('#savior-entry-list > ul');
    $('#savior-entry-single-tmpl').tmpl(savior.single).appendTo('#savior-entry-single > ul');
  });

})();