(function(){
  console.log(1);
  var body = document.body;
  window.addEventListener('scroll', function(e){
    body.style.backgroundPosition = '0 ' + parseInt(window.scrollY / 1.5) + 'px';
  }, false);
})();