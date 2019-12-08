(function($){

//stocker en variable le type de navigateur/os
var mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);

// OBJET SLIDER NIKE: start ****************************************************************
$.sliker = function(element, options) {

var defaults = {
'nbr_li': 1, //nombre d'éléments qui défilent à chaque mouvement.
'vitesse_auto': 3000, //temps entre deux mouvements automatiques.
'vitesse': 0.5, //rapidité du mouvement (automatique ou manuel, même paramètre).
'auto': 0, //activer (1) en utilisant vitesse_auto, désactiver (0) ou personnaliser ("custom"). Voir la rubrique Timer.
'type': "none", //définit le role du slider dans le cas d'une liaison. Options: visualiseur, menu, none.
'cible': "none", //spécifie l'id du slider compagnon dans le cas d'une liaison (ex: #slider_deux).
'isolement': 0, //si actif, le slider est isolé par un fond noir transparent lors de son utilisation.
'pc_only': 0, //si actif, le slider sera éffacé sur tous les dispositifs mobiles.
'loop': 0, //si actif, le slider répetera son contenu indéfiniment, créant un rail infini.
'liquid': 1, //si actif, l'élément prendra, de façon élastique, toute la zone du slider.
'drag': 0, //permet la manipulation du slider aux doigts ou en cliquer/glisser à la souris.
'creer_afficheur': 0, //crée automatiquement une zone avec l'image zoomée au dessus du slider.
'fading_mode': 0, //remplace la transition en "déplacement de rail" par un fondu.
'fading_type': 1, //mode 1: fondu blanc. mode 2: fondu enchainé entre deux images.
'buffering_nbr': 1, //nombre d'image préchargé autour de l'image active. Nécessite l'utilisation de data-src au lieu de src.
'fullscreen': 0, //affiche ou masque le bouton fullscreen.
'bullets': 1, //affiche ou masque les puces du slider.
'bullets_limit': 20, //limite de puces au délà de laquelle celles ci se transforme en un menu pages (ex: 7/22).
'bullets_limit_mobile': 8, //identique à bullets_limit mais ne s'applique qu'en cas de mobile
'arrows': 2, //affiche ou masque les flèches du slider. 0 = jamais, 1 = pc only, 2 = tout (pc et mobile)
};

// to avoid confusions, use "plugin" to reference the current instance of the object
var plugin = this;
// mettre en setting les infos récuperée à l'exécution
plugin.settings = {};
// reference to the jQuery version of DOM element the plugin is attached to
var $element = $(element);

// Intialisation des variables generales et non réinitialisables
var compteur = 1;
var right_active;
var largeur_li;
var largeur_groupe;
var nbr_li_visibles_raw;
var nbr_li_visibles;
var nbr_li;
var nbr_groupes;
/*var largeur_ul_sliker__bullets;*/
var compteur_slides_auto;
var defilement_auto;
var reste_division;
var decalage_pour_division = 0;
var offset;
var zone;
var next;
var previous;
var x;
var oneclic;
var slid_start;
var x_start;
var fading_mode_temp;





//action quand la page est entièrement chargée
$(window).on("load",function() {
	$element.removeClass("sliker--safeload");
});






/* INIT *****************************************************************************************************************************/
plugin.init = function() {

	// the plugin's final properties are the merged default and user-provided options (if any)
	plugin.settings = $.extend({}, defaults, options);

	//en mode fading type 2, le slide est obligatoirement en mode liquid
	if (plugin.settings.fading_mode == 1) {
		if (plugin.settings.fading_type == 2) {
			plugin.settings.liquid = 1;
		}
	}

	//autocréation du bouton fullscreen
	if (mobile == false && plugin.settings.fullscreen == 1 && plugin.settings.liquid == 1) {
		if($element.find(".sliker__btn-fullscreen").length < 1){
			$element.append('<a class="sliker__btn-fullscreen" href=""><i class="fa fa-expand"></i></a>');
		}
	}

	//autocréation des flèches
	if (mobile == false && plugin.settings.arrows == 1 || plugin.settings.arrows == 2) {
		if($element.is("[data-arrow]")){
			var icon = $element.attr("data-arrow");
		}else{
			var icon = "fa fa-chevron"
		}
		if($element.find(".sliker__arrow-left").length < 1){
			$element.append('<a class="sliker__arrow-left" href=""><i class="'+icon+'-left"></i></a>');
			$element.append('<a class="sliker__arrow-right" href=""><i class="'+icon+'-right"></i></a>');
		}
	}

	//modifs spéciales mobile
	if (mobile != false) {
		if (plugin.settings.drag == "mobile") {
			plugin.settings.drag = 1;
			plugin.settings.fading_mode = 0;
		}

		$element.addClass("mobile");

		if (plugin.settings.pc_only == 1) {
			$element.remove();
		}

		//réunifier bullets_limit et bullets_limit_mobile en une seule valeur
		if(plugin.settings.bullets_limit_mobile == "auto"){
			//ne rien faire, sliker par defaut n'utilise que la variable "bullets_limit"
		}else{
			plugin.settings.bullets_limit = plugin.settings.bullets_limit_mobile;
		}
	}

	//créer un afficheur statique pour mobile our pour PC si pas de cible
	if (plugin.settings.creer_afficheur == 1) {
		if (mobile != false || plugin.settings.cible == "none") {
			$element.prepend('<div class="sliker__displayer"><img class="sliker__displayer-img" src=""></div>');
			$element.find(".sliker__displayer img").attr("src",$element.find(".sliker__item:first-child img").attr("src"))

			$element.find(".sliker__item").click(function(){
				$element.find(".sliker__displayer .sliker__displayer-img").attr("src",$(this).find("img").attr("src"));
			});
		}
	}

	// creer le masque. une fois pour tous les sliders
	if ($(".sliker-isolation").length == 0 && plugin.settings.isolement == 1) {
		$("body").append('<div class="sliker-isolation"></div>');
	}

	//en mode drag, pas de mode loop
	if (plugin.settings.drag == 1) {
		plugin.settings.loop = 0;
	}

	//en mode fading, pas de mode loop non plus
	if (plugin.settings.fading_mode == 1) {
		plugin.settings.loop = 0;
	}


	plugin.reset();
	/* SYSTEME AUTO **************************************************************/
	if(plugin.settings.auto != 0){
		function loop_function(){
			if(first_loop == 0){
				compteur++;
				if (plugin.settings.loop == 1) {
					plugin.defilement_images();
				} else if (compteur <= nbr_groupes) {
					plugin.defilement_images();
				} else {
					compteur = 1;
					plugin.defilement_images();
				}
			}
			first_loop = 0;

			if(plugin.settings.auto == "custom"){
				var timer_next = $element.find(".sliker__item:nth-child(" + compteur + ")").attr("data-timer");
			}else{
				var timer_next = plugin.settings.vitesse_auto;
			}
			defilement_auto = setTimeout(loop_function, timer_next);
		};

		var first_loop = 1;
		loop_function();
	}
	/* END SYSTEME AUTO **************************************************************/
	plugin.reset();


	/* DRAG AND DROP **************************************************************/
	if (plugin.settings.drag == 1) {
		if (mobile == false) {
			$element.mousedown(function(e) {
				plugin.appuyer(e);
			});
			$element.mouseup(function(e) {
				plugin.lacher();
			});
			$element.find(".sliker__window").mouseout(function(e) {
				plugin.lacher();
			});
		} else {
			$element.bind("touchstart", function(e) {
				clearTimeout(defilement_auto);
				plugin.appuyer(e);
			});
			$element.bind("touchend", function(e) {
				plugin.lacher();
			});
		}

		$element.find('img').on('dragstart', function(event) {
			event.preventDefault();
		});
	}


	/* FULLSCREEN SYSTEM *********************************************************/
	$element.on("click", ".sliker__btn-fullscreen", function() {
		clearTimeout(defilement_auto);

		if ($element.hasClass("sliker--fullscreen")) {
			$element.removeClass("sliker--fullscreen");
			plugin.settings.fading_mode = fading_mode_temp;
			plugin.reset();
		} else {
			$element.addClass("sliker--fullscreen");
			fading_mode_temp = plugin.settings.fading_mode;
			plugin.settings.fading_mode = 1;
			plugin.reset();
		}

		return false;
	});
	/* END FULLSCREEN SYSTEM *********************************************************/

	$(window).resize(function() {
		plugin.reset();
	});

	/* coupaer défilement si clic */
	$element.mousedown(function(e) {
		clearTimeout(defilement_auto);
	});

	/* bouton pour défiler à gauche */
	$element.on("click",".sliker__arrow-left, .sliker__pages-btn-left",function() {
		clearTimeout(defilement_auto);
		compteur -= 1;
		if (plugin.settings.isolement == 1 && mobile == false) {
			plugin.afficher_cache();
		}

		plugin.defilement_images();
		return false;
	});

	/* bouton pour défiler à droite */
	$element.on("click",".sliker__arrow-right, .sliker__pages-btn-right",function() {
		clearTimeout(defilement_auto);
		compteur += 1;
		if (plugin.settings.isolement == 1 && mobile == false) {
			plugin.afficher_cache();
		}

		plugin.defilement_images();
		return false;
	});

	/* bouton aller à une page précise */
	$element.on("click", ".sliker__bulletitem", function() {
		compteur = $(this).index() + 1;
		if (plugin.settings.isolement == 1 && mobile == false) {
			plugin.afficher_cache();
		}

		plugin.defilement_images();
		clearTimeout(defilement_auto);
		return false;
	});

	/* bouton depuis un slider menu */
	if (plugin.settings.type == "visualiseur") {
		var decal;

		$(plugin.settings.cible).on("mousedown", " .sliker__item", function(e) {
			decal = e.pageX;
		});

		$(plugin.settings.cible).on("click", " .sliker__item", function(e) {
			decal = Math.abs(e.pageX - decal);
			if (decal < 10 || mobile != false) {

				/* rajouter ceci */
				if($(this).parents(".sliker__track").children("li:first-child").is("[data-group]")){
					compteur = 0;
					$(this).prevAll().each(function(){
						compteur = compteur + Math.round($(this).attr("data-group"));
					});
					compteur++;
				}else{
					compteur = $(this).index() + 1;
				}
				/* jusqu'ici */

				plugin.defilement_images();
				clearTimeout(defilement_auto);
				if (plugin.settings.isolement == 1 && mobile == false) {
					plugin.afficher_cache();
				}

				return false;
			}
		});
	}/* if visualiseur */

	$(window).scroll(function() {
		$(".sliker-isolation").fadeOut();
	});

	$("body").on("click", ".sliker-isolation", function() {
		$(".sliker-isolation").fadeOut();
	});

	//charger les images au fur et à mesure (nécessite un attribut data-src sur les images et des src vides)
	plugin.buffering_imgs();
};
/* END INIT *****************************************************************************************************************************/



















/* ACTION DEFILEMENT *****************************************************************************************************************************/
/* action qui se lance quand on clique sur un des sliker__bullets de commande (droite ou gauche) */
plugin.defilement_images = function() {
	$.event.trigger({
		type: "sliker_defilement",
		cpt: compteur,
		slider: $element,
	});

	plugin.buffering_imgs();

	$element.find(".sliker__bulletitem").removeClass("sliker__bulletitem--selected");
	$element.find(".sliker__bulletitem:nth-child(" + compteur + ")").addClass("sliker__bulletitem--selected");

	if(plugin.settings.fading_mode != 1){
		$element.find(".sliker__item").removeClass("sliker__item--selected");
		$element.find(".sliker__item:nth-child(" + compteur + ")").addClass("sliker__item--selected");
	}


	/* verifie quand le compteur est a 1 (pos de depart) ou depasse le nombre de groupe (remise a 0) */
	if (compteur == 1) {
		$element.find(".sliker__arrow-left, .sliker__pages-btn-left").css("visibility", "hidden");
	} else {
		$element.find(".sliker__arrow-left, .sliker__pages-btn-left").css("visibility", "visible");
	}

	if (compteur >= nbr_groupes) {
		$element.find(".sliker__arrow-right, .sliker__pages-btn-right").css("visibility", "hidden");
	} else {
		$element.find(".sliker__arrow-right, .sliker__pages-btn-right").css("visibility", "visible");
	}

	if (plugin.settings.loop == 1) {
		$element.find(".sliker__arrow-right, .sliker__pages-btn-right").css("visibility", "visible");
		$element.find(".sliker__arrow-left, .sliker__pages-btn-left").css("visibility", "visible");
	}

	$element.find(".sliker__track").stop();

	//les deux premières conditions n'apparaissent qu'en cas de loop
	var dernier_saut = $element.find(".sliker__item.rajout:first").index();

	//met à jour l'affichage page si présent
	$element.find(".sliker__pages .sliker__pages-text .sliker__pages-text-nbr").text(compteur);

	if(plugin.settings.fading_mode == 1){
		// function move_the_rail_before_or_after_the_fading(){
		// 	if(compteur == nbr_groupes + 1){compteur = 1;}
		// 	else if(compteur == 0){compteur = nbr_groupes;}
		// 	$element.find(".sliker__track").css({left: "-" + largeur_groupe * (compteur - 1) + "px"});
		//
		// 	$element.find(".sliker__item").removeClass("sliker__item--selected");
		// 	$element.find(".sliker__item:nth-child(" + compteur + ")").addClass("sliker__item--selected");
		//
		// 	$.event.trigger({
		// 		type: "sliker_defilement_end",
		// 		cpt: compteur,
		// 		slider: $element,
		// 	});
		// }
		//
		// if(plugin.settings.fading_type == 2){
		// 	var clone_to_fade = $element.find(".sliker__item:nth-child(" + compteur + ")").clone();
		//
		// 	$element.find(".sliker__window").prepend('<ul class="sliker__fading-mask"></ul>');
		// 	$element.find(".sliker__fading-mask").append(clone_to_fade);
		//
		// 	$element.find(".sliker__fading-mask").animate({opacity:1},500,function(){
		// 		move_the_rail_before_or_after_the_fading();
		// 		$element.find(".sliker__fading-mask").remove();
		// 	});
		// }else{
		// 	$element.find(".sliker__track").fadeOut(function(){
		// 		move_the_rail_before_or_after_the_fading();
		// 	});
		// 	$element.find(".sliker__track").fadeIn();
		// }
	}else if (compteur == nbr_groupes + 1){
		// $element.find(".sliker__bulletitem:first-child").addClass("sliker__bulletitem--selected");//allume le numï¿½ro malgrï¿½ qu'on soit sur le rajout
		// $element.find(".sliker__track").animate({left: "-" + (largeur_li * dernier_saut) + "px"}, plugin.settings.vitesse, 'linear');
		// compteur = 1;
		// $element.find(".sliker__track").animate({left: "-" + largeur_groupe * (compteur - 1) + "px"}, 1);
	}else if(compteur == 0){
		// compteur = nbr_groupes + 1;
		// $element.find(".sliker__bulletitem:last-child").addClass("sliker__bulletitem--selected");//allume le numï¿½ro malgrï¿½ qu'on soit sur le rajout
		// $element.find(".sliker__track").animate({left: "-" + (largeur_li * dernier_saut) + "px"}, 1);
		// compteur = nbr_groupes;
		// $element.find(".sliker__track").animate({left: "-" + (largeur_groupe * (compteur - 1)) + "px"}, plugin.settings.vitesse, 'linear');
	}else{
		// $element.find(".sliker__track").animate({left: "-" + largeur_groupe * (compteur - 1) + "px"}, plugin.settings.vitesse, 'linear');
		plugin.moveTo("-" + largeur_groupe * (compteur - 1));
	}

	if(plugin.settings.fading_mode != 1){
		$.event.trigger({
			type: "sliker_defilement_end",
			cpt: compteur,
			slider: $element,
		});
	}
};

plugin.moveTo = function(newPosittion) {
	$element.find(".sliker__track").css({
		"transition-duration" : plugin.settings.vitesse + "s",
		"-webkit-transform" : "translate(" + newPosittion + "px,0) translateZ(0)",
		"-ms-transform" : "translate(" + newPosittion + "px,0) translateZ(0)",
		"transform" : "translate(" + newPosittion + "px,0) translateZ(0)"
	});
}

plugin.instantMoveTo = function(newPosittion) {
	$element.find(".sliker__track").css({
		"transition-duration" : "0s",
		"-webkit-transform" : "translate(" + newPosittion + "px,0) translateZ(0)",
		"-ms-transform" : "translate(" + newPosittion + "px,0) translateZ(0)",
		"transform" : "translate(" + newPosittion + "px,0) translateZ(0)"
	});
}
/* ACTION DEFILEMENT *****************************************************************************************************************************/





















//fonctions externes
plugin.afficher_cache = function() {
	$(".sliker-isolation").fadeIn();
};

plugin.buffering_imgs = function() {
	//plugin.settings.buffering_nbr est une option de lancement qui définit le nbr d'images à charger
	// de CHAQUE coté du slide actif (default: 1 -> donc trois images potentiellement chargées)
	for (var i=compteur-plugin.settings.buffering_nbr;i<=compteur+plugin.settings.buffering_nbr;i++) {

		var src = $element.find(".sliker__item:nth-child(" + i + ") img[data-sliker-src]").attr("src");

		if(typeof src === 'undefined'){
			var data_src = $element.find(".sliker__item:nth-child(" + i + ") img[data-sliker-src]").attr("data-sliker-src");
			$element.find(".sliker__item:nth-child(" + i + ") img[data-sliker-src]").attr("src",data_src);
		}
	}
};

plugin.appuyer = function(e) {
	$element.find(".sliker__track").stop();
	oneclic = 1;
	if (mobile == false) {
		x_start = Math.round(e.pageX - offset.left);
	} else {
		var touch1 = e.originalEvent.touches[0];
		x_start = Math.round(touch1.pageX - offset.left);
	}
	slid_start = $element.find(".sliker__track").position();

	slid_start = Math.round(slid_start.left);
	if (mobile == false) {
		$element.find(".sliker__window").mousemove(function(e) {
			x = Math.round(e.pageX - offset.left);
			plugin.bouger(e);
		});
	} else {
		$element.find(".sliker__window").bind("touchmove", function(e) {
			var touch = e.originalEvent.touches[0];
			x = Math.round(touch.pageX - offset.left);
			plugin.bouger(e);

			return false;
		});
	}
};

plugin.bouger = function(e) {
	var newTransformPosition = slid_start + (x - x_start);

	$element.find(".sliker__track").css({
		"transition-duration" : "0s",
		'-webkit-transform' : 'translate(' + newTransformPosition + 'px,0px) translateZ(0)',
		'-moz-transform'    : 'translate(' + newTransformPosition + 'px,0px) translateZ(0)',
		'-ms-transform'     : 'translate(' + newTransformPosition + 'px,0px) translateZ(0)',
		'-o-transform'      : 'translate(' + newTransformPosition + 'px,0px) translateZ(0)',
		'transform'         : 'translate(' + newTransformPosition + 'px,0px) translateZ(0)'
	});
	if ((x - x_start) < (zone / 8 * -1)) {
		previous = 0;
		next = 1;
	}
	if ((x - x_start) > (zone / 8)) {
		next = 0;
		previous = 1;
	}
	return false;
};

plugin.lacher = function(e) {
	if (oneclic == 1) {
		oneclic = 0;
		if (mobile == false) {
			$element.find(".sliker__window").unbind("mousemove");
		} else {
			$element.find(".sliker__window").unbind("touchmove");
		}
		if (next == 1) {
			next = 0;
			compteur += 1;
			if (compteur > nbr_groupes) {
				compteur = nbr_groupes;
			}

			if (plugin.settings.isolement == 1 && mobile == false) {
				plugin.afficher_cache();
			}

			plugin.defilement_images();
		} else if (previous == 1) {
			previous = 0;
			compteur -= 1;
			if (compteur < 1) {
				compteur = 1;
			}

			if (plugin.settings.isolement == 1 && mobile == false) {
				plugin.afficher_cache();
			}

			plugin.defilement_images();
		} else {
			plugin.defilement_images();
		}
	}/* oneclic */
};
















plugin.reset = function() {

	if (plugin.settings.liquid == 1) {
		$element.find(".sliker__window .sliker__item").width($element.find(".sliker__window").width());
	}

	/* supprimer les li rajouts, ils vont être calculés à nouveau */
	$element.find(".rajout").remove();
	/* calcule la largeur d'un li */
	largeur_li = $element.find(".sliker__item").outerWidth(true);
	if(!largeur_li){largeur_li = 20;/* generique */}
	/* compte le nombre de li visibles en même temps */

	nbr_li_visibles_raw = $element.find(".sliker__window").width() / largeur_li;
	nbr_li_visibles = Math.floor(nbr_li_visibles_raw);

	//choisir ici le pourcentage (0.8 = 80%) à partir duquel l'image compte comme vue meme si tronquée
	if((nbr_li_visibles_raw-nbr_li_visibles)>0.8){
		nbr_li_visibles = nbr_li_visibles+1;
	}

	if (nbr_li_visibles < 1) {
		nbr_li_visibles = 1;
	};
	if (nbr_li_visibles < plugin.settings.nbr_li) {
		plugin.settings.nbr_li = nbr_li_visibles;
	};
	/* calcule la largeur d'un groupe de vignettes */
	largeur_groupe = largeur_li * plugin.settings.nbr_li;
	/* compte le nombre de li */
	nbr_li = Math.ceil($element.find(".sliker__item").length);
	/* Fait en sorte de ne pas tenir compte des li en bout de chaine quand les lis visibles sont plus nombreux que les li par groupe.
	 Ne pas faire cette soustraction quand on est en mode loop*/
	nbr_groupes = Math.ceil((nbr_li - (nbr_li_visibles - plugin.settings.nbr_li)) / plugin.settings.nbr_li);

	//si un seule groupe on coupe le défilement auto (pour ne pas boucler sur le même élément)
	if (nbr_groupes <= 1) {
		nbr_groupes = 1;
		clearTimeout(defilement_auto);
	};

	if (plugin.settings.loop == 1) {
		nbr_groupes = Math.ceil(nbr_li / plugin.settings.nbr_li);
	}
	/* vérifier si le compteur n'est pas absurde */
	if (compteur > nbr_groupes) {
		compteur = nbr_groupes;
	}


	//départ alternatif si spécifié par la class "selected" (à mettre sur un li)
	if($element.find(".sliker__item--selected").length==1){
		compteur = $element.find(".sliker__item--selected").index()+1;
	}else{
		$element.find(".sliker__item:first-child").addClass("sliker__item--selected");
	}

	/* Positionne le slider au départ */
	// $element.find(".sliker__track").css("left", (compteur - 1) * -1 * largeur_li);
	plugin.instantMoveTo((compteur - 1) * -1 * largeur_li);

	/* affiche le bouton de défilement de droite (si il y a plus d'un groupe) (visibility pour ne pas dï¿½caler le slider) */
	if (nbr_groupes == 1 || nbr_groupes == 0) {
		$element.find(".sliker__arrow-left, .sliker__arrow-right").css("visibility", "hidden");
	}else if (plugin.settings.loop == 1) {
		$element.find(".sliker__arrow-left, .sliker__arrow-right").css("visibility", "visible");
	} else if (compteur == 1) {
		$element.find(".sliker__arrow-left").css("visibility", "hidden");
		$element.find(".sliker__arrow-right").css("visibility", "visible");
	} else if (compteur == nbr_groupes) {
		$element.find(".sliker__arrow-left").css("visibility", "visible");
		$element.find(".sliker__arrow-right").css("visibility", "hidden");
	} else {
		$element.find(".sliker__arrow-left, .sliker__arrow-right").css("visibility", "visible");
	}

	/* CREER DES PUCES (lien direct de page) */
	//supprimer les puces totalement avant de les recréer
	$element.find(".sliker__bullets").remove();
	$element.find(".sliker__pages").remove();

	//si un autre slider sert de menu (ou si celui ci est un menu) => pas besoin de puces
	if(plugin.settings.bullets == 1 && nbr_groupes > 1) {
		if(plugin.settings.bullets_limit >= nbr_groupes){
			$element.find(".sliker__window").after('<ul class="sliker__bullets"></ul>');

			for (var i = 1; i <= nbr_groupes; i++) {
				//créer les puces, check l'attr data-bullet qui permet de créer des puces icones
				if($element.is("[data-bullet]")){
					$element.find(".sliker__bullets").append('<li class="sliker__bulletitem">' + $element.attr("data-bullet") + '</li>');
				}else{
					$element.find(".sliker__bullets").append('<li class="sliker__bulletitem"><span class="sliker__bullet-classic">"+i+"</span></li>');
				}
			}
		}else{
			if($element.is("[data-arrow]")){
				var icon = $element.attr("data-arrow");
			}else{
				var icon = "fa fa-chevron"
			}
			$element.find(".sliker__window").after('<div class="sliker__pages"><div class="sliker__pages-wrap"></div></div>');
			$element.find(".sliker__pages .sliker__pages-wrap").append('<span class="sliker__pages-btn-left"><i class="'+icon+'-left"></i></span>');
			$element.find(".sliker__pages .sliker__pages-wrap").append('<span class="sliker__pages-text"><span class="sliker__pages-text-nbr">'+compteur+'</span>/'+nbr_groupes+'</span>');
			$element.find(".sliker__pages .sliker__pages-wrap").append('<span class="sliker__pages-btn-right"><i class="'+icon+'-right"></i></span>');
		}
	}
	/* END CREER DES PUCES */

	/* à lancer une seule fois pour la première selection de puce si il y a */
	$element.find(".sliker__bulletitem:nth-child(" + compteur + ")").addClass("sliker__bulletitem--selected");

	/* si on doit looper, rajouter des li fictifs à la fin du slide */
	if (plugin.settings.loop == 1) {
		for (var i = 0; i <= nbr_li_visibles * 2; i++) {
			$element.find(".sliker__item:nth-child(" + i + ")").clone()
					.addClass("rajout").appendTo($element.find(".sliker__track"));
		}
	}
	offset = $element.find(".sliker__window").offset();
	zone = $element.find(".sliker__window li").width();
};


// call the "constructor" method init
plugin.init();

};// END OF THE SLIKER METHOD


// add the plugin as a jQuery object
$.fn.sliker = function(options) {
	return this.each(function() {
		if (undefined === $(this).data('sliker')) {
			var plugin = new $.sliker(this, options);
			$(this).data('sliker', plugin);
		}
	});
};

})(jQuery);
