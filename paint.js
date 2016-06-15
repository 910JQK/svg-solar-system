/**
 * SVG Solar System
 * author: 910JQK
 * license: MIT
 */


'use strict';
const PLANETS = {
    mercury: {
	name: 'Mercury',
	inner: true,
	color: 'hsl(25, 100%, 30%)'
    },
    venus: {
	name: 'Venus',
	inner: true,
	color: 'hsl(50, 100%, 30%)'
    },
    earth_moon_inner: {
	name: 'Earth',
	inner: true,
	color: 'hsl(250, 60%, 30%)'
    },
    earth_moon_outer: {
	name: 'Earth',
	inner: false, /* 地球兩邊都畫 */
	color: 'hsl(250, 60%, 30%)'
    },
    mars: {
	name: 'Mars',
	inner: true, /* 為了效果好，把火星放在 INNER 組裡 */
	color: 'hsl(0, 100%, 30%)'
    },
    jupiter: {
	name: 'Jupiter',
	inner: false,
	color: 'hsl(290, 100%, 30%)'
    },
    saturn: {
	name: 'Saturn',
	inner: false,
	color: 'hsl(20, 100%, 30%)'
    },
    uranus: {
	name: 'Uranus',
	inner: false,
	color: 'hsl(200, 75%, 30%)'
    },
    neptune: {
	name: 'Neptune',
	inner: false,
	color: 'hsl(233, 75%, 30%)'
    }
}
const INNER = ['mercury', 'venus', 'earth_moon_inner', 'mars'];
const OUTER = ['earth_moon_outer', 'jupiter', 'saturn', 'uranus', 'neptune'];
const RATIO_INNER = 150; // px per AU
const RATIO_OUTER = 8; // px per AU
const PLANET_SIZE = 3;
const SVG_NS = 'http://www.w3.org/2000/svg';


/**
 * A tiny tool from https://github.com/SubwayDesktop/simple.js/
 * Returns a copy of "str" with placeholders replaced by the rest arguments.
 * @param String str
 * @param String ...args
 * @return String
 */
function printf(){
    var str = arguments[0];
    var args = arguments;
    str = str.replace(/%(\d+)|%{(\d+)}/g, function(match, number1, number2){
	var number = number1? number1: number2;
	return (typeof args[number] != 'undefined')? args[number]: match;
    });
    return str;
}


/**
 * Create an SVG Element of specified type with specified attributes and style
 * @param type String (tag name)
 * @param attributes Object (key-value pairs)
 * @return SVGElement
 */
function create(type, attributes){
    var element = document.createElementNS(SVG_NS, type);
    if(attributes){
	let style_str = '';
	for(let I of Object.keys(attributes)){
	    if(I == 'style')
		for(let I of Object.keys(attributes.style))
		    style_str += printf('%1: %2;', I, attributes.style[I]);
	    else
		element.setAttributeNS(null, I, attributes[I]);
	}
	if(style_str)
	    element.setAttributeNS(null, 'style', style_str);
    }
    return element;
}


/**
 * Draw an orbit with specified parameters (of the projection on ecliptic)
 * @param rx Number - half axis length in x direction
 * @param ry Number - half axis length in y direction
 * @param dx Number - projection length of OF (O: center of orbit, F: focus)
 * @param theta Number - angle between FP' and x (P': proj. of perihelion)
 * @param ratio Number - ratio, px per AU
 * @return SVGElement
 */
function draw_orbit(rx, ry, dx, theta, ratio){
    var orbit = create('ellipse', {
	class: 'orbit',
	cx: 0,
	cy: 0,
	rx: rx*ratio,
	ry: ry*ratio,
	transform: printf('rotate(%{1}) translate(%{2}, 0)', theta, -dx*ratio)
    });
    return orbit;
}


/**
 * Draw a planet with specified parameters
 * @param ec Object {x:Number, y:Number, z:Number} - ecliptic coordinate
 * @param ratio Number - ratio, px per AU
 * @param color String - fill color
 * @return SVGElement
 */
function draw_planet(ec, ratio, color){
    var planet = create('circle', {
	class: 'planet',
	cx: ec.x*ratio,
	cy: ec.y*ratio,
	r: PLANET_SIZE,
	style: {fill: color}
    });
    return planet;
}


/**
 * Draw a label with specified parameters
 * @param ec Object {x:Number, y:Number, z:Number} - ecliptic coordinate
 * @param text String - text of label
 * @param ratio Number - ratio, px per AU
 * @param color String - color of text
 * @return SVGElement
 */
function draw_label(ec, text, ratio, color){
    let x_p = ec.x*ratio;
    let y_p = ec.y*ratio;
    let label = create('text', {
	class: 'planet_label',
	x: x_p,
	y: y_p,
	/* 修復因坐標變換導致的文字鏡像並稍加上移 */
	transform: printf('matrix(1, 0, 0, -1, 0, %{1})', 2*y_p+5),
	style: {fill: color}
    });
    label.textContent = text;
    return label;
}


/**
 * Paint diagrams
 * @param T Number - the number of centuries past J2000
 * @return void
 */
function paint(T){
    for(let planet of Object.keys(PLANETS)){
	let planet_name = planet;
	if(planet.startsWith('earth_moon'))
	    planet_name = 'earth_moon';
	let p = parameters(planet_name, T);

	/* 計算投影到黄道面後軌道的兩個半軸 */
	let e = p.e;
	let a = p.a;
	let c = e*a;
	let b = Math.sqrt(a*a-c*c);
	let O = ecliptic_coordinate({x:-c, y:0, z:0}, p.I, p.omega, p.Omega);
	let A = ecliptic_coordinate({x:a-c, y:0, z:0}, p.I, p.omega, p.Omega);
	let B = ecliptic_coordinate({x:-c, y:b, z:0}, p.I, p.omega, p.Omega);
	let theta = normalize_angle(atan2(A.y, A.x));
	let rx = Math.sqrt((A.x-O.x)*(A.x-O.x) + (A.y-O.y)*(A.y-O.y));
	let ry = Math.sqrt((B.x-O.x)*(B.x-O.x) + (B.y-O.y)*(B.y-O.y));
	let dx = Math.sqrt(O.x*O.x + O.y*O.y);
	
	let g = create('g', { class: 'planet_g ' + planet_name });
	let color = PLANETS[planet].color;
	let label_text = PLANETS[planet].name;
	if(PLANETS[planet].inner){
	    g.appendChild(draw_orbit(rx, ry, dx, theta, RATIO_INNER));
	    g.appendChild(draw_planet(p.ec, RATIO_INNER, color));
	    g_inner.appendChild(g);
	    g_label_inner.appendChild(
		draw_label(p.ec, label_text, RATIO_INNER, color)
	    );
	}else{
	    g.appendChild(draw_orbit(rx, ry, dx, theta, RATIO_OUTER));
	    g.appendChild(draw_planet(p.ec, RATIO_OUTER, color));
	    g_outer.appendChild(g);
	    g_label_outer.appendChild(draw_label(p.ec, label_text, RATIO_OUTER, color));
	}
    }
}


/**
 * Clear the diagram
 * @return void
 */
function clear(){
    function empty(node){
	while(node.firstChild)
	    node.removeChild(node.firstChild);
    }
    empty(g_inner);
    empty(g_outer);
    empty(g_label_inner);
    empty(g_label_outer);
}
