/**
 * SVG Solar System
 * author: 910JQK
 * license: MIT
 */


'use strict';
const DAYS = [0, 31, -1, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];


/**
 * Check if the specified year is a leap year
 * @param y Number
 * @return Boolean
 */
function is_leap_year(y){
    if(y % 100 == 0){
	if(y % 400 == 0)
	    return true;
	else
	    return false;
    } else {
	if(y % 4 == 0)
	    return true;
	else
	    return false;	
    }    
}


/**
 * Render the diagram of the selected time
 * @param y Number - year in [-2999, 3000]
 * @param m Number - month
 * @param d Number - day
 * @return void
 */
function render(y, m, d){
    var JD = jd_gregorian(y, m, d);
    var T = jd_time(JD);
    clear();
    paint(T);
}


/**
 * Click event handler for input_y
 * @return void
 */
function change_y(){
    var y = parseInt(input_y.value);
    var m = parseInt(input_m.value);
    var d = parseInt(input_d.value);
    render(y, m, d);
}


/**
 * Click event handler for input_m
 * @return void
 */
function change_m(){
    var y = parseInt(input_y.value);
    var m = parseInt(input_m.value);
    var d = parseInt(input_d.value);
    if(m > 12){
	m = 1;
	input_m.value = m;
	if(y < 3000){
	    y++;
	    input_y.value = y;	    
	}
    }
    if(m < 1){
	m = 12;
	input_m.value = m;
	if(y > -2999){
	    y--;
	    input_y.value = y;
	}
    }
    render(y, m, d);
}


/**
 * Click event handler for input_d
 * @return void
 */
function change_d(){
    var y = parseInt(input_y.value);
    var m = parseInt(input_m.value);
    var d = parseInt(input_d.value);
    var leap = is_leap_year(y);
    var dm;
    if(m == 2){
	if(leap)
	    dm = 29;
	else
	    dm = 28;
    } else {
	dm = DAYS[m];
    }
    if(d > dm){
	input_d.value = 1;
	input_m.value = m+1;
	change_m();
	return;
    }
    if(d < 1){
	let m0 = (m == 1)? 12: m-1;
	if(m0 == 2){
	    if(leap)
		input_d.value = 29;
	    else
		input_d.value = 28;
	} else {
	    input_d.value = DAYS[m0];
	}
	input_m.value = m-1;
	change_m();
	return;
    }
    render(y, m, d);
}


/**
 * Function loaded when the page has been loaded
 * @return void
 */
function init(){
    var date = new Date(Date.now());
    var y = date.getFullYear();
    var m = date.getMonth() + 1;
    var d = date.getDate();
    
    var JD = jd_gregorian(y, m, d);
    var T = jd_time(JD);
    paint(T);

    input_y.value = y;
    input_m.value = m;
    input_d.value = d;
    
    input_y.addEventListener('change', change_y);
    input_m.addEventListener('change', change_m);
    input_d.addEventListener('change', change_d);
}
window.addEventListener('load', init);
