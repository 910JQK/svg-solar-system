/**
 * SVG Solar System
 * author: 910JQK
 * license: MIT
 */


'use strict';
const PI = Math.PI;
const J2000_UTC = 946727935816;


var deg2rad = (x => x*PI/180);
var rad2deg = (x => x*180/PI);
var sin = (x => Math.sin(deg2rad(x)) );
var cos = (x => Math.cos(deg2rad(x)) );
var tan = (x => Math.tan(deg2rad(x)) );
var atan = (x => rad2deg(Math.atan(x)) );
var atan2 = ((y, x) => rad2deg(Math.atan2(y, x)) );


/**
 * 軌道坐标到黄道坐标的變換矩陣 
 * Rz(-Omega)*Rx(-I)*Rz(-omega)
 */
var transform = ((I, omega, Omega) => [
    [
	cos(omega)*cos(Omega)-cos(I)*sin(omega)*sin(Omega),
	-cos(Omega)*sin(omega)-cos(I)*cos(omega)*sin(Omega),
	sin(I)*sin(Omega)
    ],
    [
	cos(I)*cos(Omega)*sin(omega)+cos(omega)*sin(Omega),
	cos(I)*cos(omega)*cos(Omega)-sin(omega)*sin(Omega),
	-cos(Omega)*sin(I)
    ],
    [
	sin(I)*sin(omega),
	cos(omega)*sin(I),
	cos(I)
    ]
]);


/**
 * 返回指定日期（格里曆）12:00 的儒略日
 * @param year Number
 * @param month Number
 * @param day Number
 * @return Number
 */
function jd_gregorian(year, month, day){
    var a = Math.floor((14-month)/12);
    var y = year + 4800 - a;
    var m = month + 12*a - 3;
    return day + Math.floor((153*m+2)/5) + 365*y+Math.floor(y/4)
	- Math.floor(y/100) + Math.floor(y/400)-32045;
}


/**
 * 將儒略日轉換為 J2000 算起的世紀數
 * @param JD Number
 * @return Number
 */
function jd_time(JD){
    return (JD - 2451545) / 36525;
}


/**
 * 將 UNIX 時間轉換為 J2000 算起的世紀數
 * @param unix_time Number (millisecond)
 * @return Number (century)
 */
function u_time(unix_time){
    /* Approximation: UTC = TT */
    return (unix_time - J2000_UTC)/1000/86400/36525;
}


/**
 * 將角度正規化到 [0, 360) 內
 * @param x Number (degree)
 * @return Number (degree)
 */
function normalize_angle(x){
    x %= 360;
    if(x < 0)
	x += 360;
    return x;
}


/**
 * 返回平近點角 M
 * @param L Number (degree) 平黄經
 * @param pi Number (degree) 近日點黄經
 * @return Number (degree)
 */
function mean_anomaly(L, pi){
    return L - pi;
}


/**
 * 修正平近點角 M
 * @param M Number (degree) 由 "M = L - pi" 算出的平近點角
 * @param T Number 從 J2000 算起的世紀数
 * @param planet String 行星名稱（木星及以外需要修正）
 * @return Number (degree)
 */
function fix_mean_anomaly(M, T, planet){
    if(FIX.hasOwnProperty(planet)){
	let fix = FIX[planet];
	return M + fix[0]*T*T + fix[1]*cos(fix[3]*T) + fix[2]*sin(fix[3]*T);
    } else {
	return M;
    }
}


/**
 * 返回偏近點角 E
 * @param M Number (degree) 平近點角
 * @param e Number 軌道離心率
 * @return Number (degree)
 */
function eccentric_anomaly(M, e){
    var x = PI, xl = 0;
    /* use radian here */
    var m = deg2rad(M);
    /* Solve Kepler's equation using Newton's Method */
    while(Math.abs(x - xl) >= 1e-6){
	xl = x;
	x = x - (e*Math.sin(x) - x + m) / (e*Math.cos(x) - 1);
    }
    /* convert back to degree */
    return rad2deg(x);
}


/**
 * 返回真近點角 v
 * @param E Number (degree) 偏近點角
 * @param e Number 軌道離心率
 * @return Number (degree)
 */
function true_anomaly(E, e){
    return 2*atan(tan(E/2)*Math.sqrt((1+e)/(1-e)) );
}


/**
 * 返回軌道坐標（直角坐標）
 * @param v (degree) 真近點角
 * @param a (AU) 半長軸長
 * @param e 軌道離心率
 * @return Object {x: Number, y: Number, z: Number}
 */
function orbital_coordinate(v, a, e){
    var r = a*(1-e*e)/(1+e*cos(v));
    return {
	x: r*cos(v),
	y: r*sin(v),
	z: 0
    };
}


/**
 * 返回黄道坐標（直角坐標）
 * @param o_coordinate Object {x: Number, y: Number, z: Number} 軌道坐標
 * @param I Number (degree) 軌道傾角
 * @param omega Number (degree) 近日點參数（近日點角）
 * @param Omega Number (degree) 升交點黄經
 * @return Object {x: Number, y: Number, z: Number}
 */
function ecliptic_coordinate(o_coordinate, I, omega, Omega){
    var x = o_coordinate.x;
    var y = o_coordinate.y;
    var z = o_coordinate.z;
    var T = transform(I, omega, Omega);
    return {
	x: x*T[0][0] + y*T[0][1] + z*T[0][2],
	y: x*T[1][0] + y*T[1][1] + z*T[1][2],
	z: x*T[2][0] + y*T[2][1] + z*T[2][2]
    };
}


/**
 * 返回行星位置和軌道參数
 * @param planet String 行星名稱
 * @param T 從 J2000 算起的世紀数
 * @return Object
 * 符號    單位     意義
 * -----------------------------------------------------
 * a       AU       軌道半長軸長
 * e        -       軌道離心率
 * I       deg      軌道傾角
 * L       deg      平黄經
 * pi      deg      近日點黄經 (= omega + Omega)
 * Omega   deg      升交點黄經
 * omega   deg      近日點參数（近日點角）
 * M       deg      平近點角
 * E       deg      偏近點角
 * v       deg      真近點角
 * oc      AU       日心軌道直角坐標
 * ec      AU       日心黄道直角坐標
 * hL      deg      日心黄經
 * hB      deg      日心黄緯
 * -----------------------------------------------------
 *     以上度量使用 J2000.0 平黄道和平春分點作為參考
 * -----------------------------------------------------
 */
function parameters(planet, T){
    var data = DATA[planet];

    var a = data.data.a + data.delta.a*T;
    var e = data.data.e + data.delta.e*T;
    var I = data.data.I + data.delta.I*T;
    var L = normalize_angle(data.data.L + data.delta.L*T);
    var pi = data.data.pi + data.delta.pi*T;
    var Omega = data.data.Omega + data.delta.Omega*T;
    var omega = pi - Omega;
    
    var M = normalize_angle(fix_mean_anomaly(mean_anomaly(L, pi), T, planet));
    var E = eccentric_anomaly(M, e);
    var v = true_anomaly(E, e);
    var oc = orbital_coordinate(v, a, e);
    var ec = ecliptic_coordinate(oc, I, omega, Omega);
    var hL = normalize_angle(atan2(ec.y, ec.x));
    var hB = atan(ec.z / Math.sqrt(ec.x*ec.x + ec.y*ec.y));
    return {
	a, e, I, L, pi, omega, Omega, M, E, v, oc, ec, hL, hB
    };
}
