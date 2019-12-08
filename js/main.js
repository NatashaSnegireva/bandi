 $(document).ready(function(){
 	var $page = $('html, body');
	$('.nav a[href*="#"]').click(function() {
	    $page.animate({
	        scrollTop: $($.attr(this, 'href')).offset().top
	    }, 400);
	    return false;
	});
 	 $("#theTarget").skippr({
		transition: 'fade',
		speed: 500,
		easing: 'easeOutQuart',
		navType: 'block',
		childrenElementType: 'div',
		arrows: false,
		autoPlay: true,
		autoPlayDuration: 4000,
		keyboardOnAlways: true,
		hidePrevious: false
	});
 	$('.sliker').sliker();
});