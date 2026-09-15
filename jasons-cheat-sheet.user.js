// ==UserScript==
// @name         Jason's Cheat Sheet
// @namespace    jason.fantasyhoops
// @version      1.12
// @description  Live 9-cat category ranks and pick suggestions inside the Yahoo draft room
// @match        https://basketball.fantasysports.yahoo.com/draftclient/*
// @run-at       document-start
// @grant        none
// @updateURL    https://raw.githubusercontent.com/JWangDes/Fantasy-Basketball-Cheat-Sheet/main/jasons-cheat-sheet.user.js
// @downloadURL  https://raw.githubusercontent.com/JWangDes/Fantasy-Basketball-Cheat-Sheet/main/jasons-cheat-sheet.user.js
// ==/UserScript==
(function () {
  'use strict';
  if (window.__fhOverlay) return; window.__fhOverlay = true;

  // ---------- 2026-27 projections: [name, team, pos, [GP,FG%,FT%,3PM,PTS,REB,AST,STL,BLK,TO]] ----------
  const PROJ = [["N. Jokić","DEN","C",[71.0,0.573,0.82,1.7,27.8,13.0,10.1,1.5,0.7,3.4]],["V. Wembanyama","SAS","C",[68.0,0.519,0.823,1.9,25.7,11.4,3.4,1.0,3.4,2.8]],["L. Dončić","LAL","PG,SG",[66.0,0.471,0.782,3.8,31.8,7.7,8.2,1.6,0.5,3.8]],["S. Gilgeous-Alexander","OKC","PG",[73.0,0.537,0.885,1.7,30.9,4.6,6.3,1.6,0.8,2.2]],["C. Cunningham","DET","PG,SG",[69.0,0.462,0.83,2.1,24.9,6.1,9.5,1.2,0.8,4.0]],["G. Antetokounmpo","MIA","PF,C",[68.0,0.61,0.637,0.3,29.7,10.5,6.3,1.0,1.0,3.3]],["J. Tatum","BOS","SF,PF",[68.0,0.455,0.82,3.2,25.1,9.2,5.3,1.0,0.5,2.6]],["A. Edwards","MIN","PG,SG",[76.0,0.468,0.817,3.5,28.2,5.6,3.5,1.3,0.7,3.0]],["J. Johnson","ATL","SF,PF",[65.0,0.498,0.79,1.6,22.3,9.8,7.7,1.3,0.6,3.1]],["C. Flagg","DAL","SG,SF,PF",[75.0,0.473,0.84,1.3,23.0,7.7,5.0,1.3,1.0,2.5]],["D. Mitchell","CLE","PG,SG",[67.0,0.467,0.853,3.3,26.6,4.9,5.6,1.5,0.3,2.6]],["S. Barnes","TOR","SF,PF,C",[71.0,0.481,0.789,1.1,19.4,7.8,5.1,1.5,1.4,2.8]],["T. Maxey","PHI","PG",[69.0,0.467,0.885,3.1,26.1,3.6,5.8,1.6,0.6,2.2]],["K. Towns","NYK","PF,C",[73.0,0.509,0.849,1.7,20.8,11.4,3.5,0.9,0.6,2.5]],["A. Şengün","HOU","PF,C",[71.0,0.513,0.692,0.5,21.1,9.2,6.3,1.2,1.0,3.0]],["T. Haliburton","IND","PG,SG",[68.0,0.462,0.854,2.7,17.5,3.4,8.9,1.3,0.6,1.7]],["A. Thompson","HOU","PG,SG",[72.0,0.543,0.768,0.4,18.3,7.8,5.1,1.6,0.9,2.2]],["A. Reaves","LAL","PG,SG,SF",[70.0,0.476,0.87,2.4,23.8,5.4,5.7,1.1,0.3,2.6]],["T. Young","WAS","PG",[68.0,0.422,0.861,2.7,22.9,2.8,10.0,1.1,0.1,4.1]],["K. Durant","HOU","SG,SF,PF",[69.0,0.523,0.861,2.1,23.6,5.0,4.1,0.7,0.9,2.8]],["E. Mobley","CLE","PF,C",[70.0,0.551,0.658,1.0,18.4,9.3,3.6,0.8,1.7,2.0]],["J. Brunson","NYK","PG",[72.0,0.475,0.835,2.5,25.7,3.2,6.8,0.8,0.1,2.4]],["J. Murray","DEN","PG",[68.0,0.472,0.883,3.0,24.4,4.2,6.7,1.0,0.5,2.2]],["B. Adebayo","MIA","PF,C",[74.0,0.449,0.772,2.0,20.3,8.6,3.7,1.2,0.7,1.9]],["J. Giddey","CHI","PG,SG",[69.0,0.455,0.772,1.8,16.3,8.1,9.0,1.1,0.6,3.4]],["A. Davis","WAS","PF,C",[58.0,0.526,0.782,0.5,21.9,10.6,3.1,1.1,1.9,2.0]],["D. Booker","PHX","PG,SG",[68.0,0.465,0.882,2.1,26.0,4.0,6.3,0.8,0.3,2.9]],["S. Curry","GSW","PG",[66.0,0.453,0.929,4.4,24.5,3.8,4.8,0.9,0.3,2.5]],["D. Sabonis","SAC","PF,C",[69.0,0.581,0.733,0.6,16.7,12.9,5.7,0.7,0.4,2.7]],["D. Avdija","POR","SG,SF,PF",[72.0,0.473,0.789,1.7,20.7,9.9,5.5,0.9,0.6,3.0]],["J. Harden","CLE","PG,SG",[71.0,0.423,0.881,2.5,18.4,4.6,7.3,1.1,0.5,3.2]],["C. Holmgren","OKC","PF,C",[66.0,0.539,0.785,1.4,17.2,9.6,2.0,0.7,2.1,1.7]],["L. Ball","MIN","PG",[60.0,0.416,0.874,3.9,22.5,5.4,7.3,1.4,0.3,3.2]],["W. Kessler","LAL","C",[67.0,0.642,0.629,0.5,14.1,11.9,1.7,0.7,2.7,1.7]],["J. Williams","OKC","SF,PF",[69.0,0.496,0.809,1.4,20.2,6.6,5.3,1.4,0.5,2.0]],["J. Duren","DET","C",[71.0,0.657,0.731,0.0,18.3,11.3,2.5,0.8,1.0,2.1]],["P. Banchero","ORL","PF",[70.0,0.456,0.753,1.5,24.2,8.2,5.3,0.8,0.6,3.2]],["T. Murphy III","NOP","SG,SF",[68.0,0.463,0.877,3.2,21.8,5.9,3.6,1.3,0.5,1.7]],["J. Brown","PHI","SG,SF,PF",[69.0,0.473,0.777,1.9,24.0,6.0,4.6,1.1,0.4,3.0]],["B. Miller","CHA","SF,PF",[68.0,0.438,0.875,3.5,23.3,5.2,4.0,1.1,0.7,2.6]],["K. Knueppel","CHA","SG,SF",[79.0,0.477,0.87,3.8,21.2,5.9,3.9,0.8,0.3,2.3]],["D. Clingan","POR","C",[73.0,0.539,0.656,1.0,13.5,13.1,2.3,0.7,2.0,1.5]],["L. Markkanen","UTA","SF,PF",[68.0,0.463,0.891,2.9,23.6,8.0,1.9,0.9,0.5,1.5]],["P. Siakam","IND","PF,C",[70.0,0.504,0.711,1.5,21.6,6.7,3.7,0.9,0.4,1.8]],["F. Wagner","ORL","SF,PF",[67.0,0.485,0.848,1.7,24.2,5.7,4.2,1.1,0.4,2.1]],["D. White","BOS","PG,SG",[73.0,0.423,0.878,2.9,16.7,4.3,5.2,1.0,1.2,1.7]],["K. Leonard","TOR","SG,SF,PF",[60.0,0.507,0.878,2.3,24.6,6.2,3.4,1.7,0.5,1.9]],["T. Herro","MIL","PG,SG",[66.0,0.465,0.886,3.2,23.7,5.0,4.9,0.8,0.2,2.3]],["O. Okongwu","ATL","C",[75.0,0.481,0.763,2.0,15.6,8.1,2.9,1.1,1.3,1.6]],["J. Randle","BKN","PF",[70.0,0.46,0.802,1.5,19.8,7.0,4.9,0.9,0.2,2.8]],["D. Daniels","ATL","SG,SF",[72.0,0.516,0.618,0.7,13.1,6.6,5.6,2.4,0.6,1.9]],["D. Garland","LAC","PG",[68.0,0.463,0.864,2.9,21.6,2.8,7.2,1.2,0.2,3.0]],["R. Rollins","MIL","PG,SG",[70.0,0.482,0.81,2.5,18.4,4.9,5.7,1.6,0.5,2.8]],["J. Jackson Jr.","UTA","PF,C",[66.0,0.472,0.81,1.6,18.8,6.5,2.1,1.2,1.7,2.2]],["N. Alexander-Walker","ATL","PG,SG",[80.0,0.454,0.861,3.0,19.1,3.5,3.5,1.1,0.5,1.8]],["S. Castle","SAS","PG,SG",[73.0,0.486,0.74,1.4,18.4,5.4,6.9,1.4,0.3,3.1]],["K. Irving","DAL","PG",[57.0,0.475,0.914,2.8,21.4,4.2,4.2,1.0,0.4,1.7]],["L. James","PHI","SF,PF",[66.0,0.51,0.755,1.3,18.5,5.7,6.3,0.9,0.5,2.7]],["D. Bane","ORL","SG,SF",[70.0,0.481,0.899,2.3,20.3,4.3,4.1,1.1,0.4,2.2]],["C. Boozer","MEM","PF",[75.0,0.486,0.783,1.3,17.3,8.5,3.4,0.9,0.6,2.4]],["M. Buzelis","CHI","SF,PF",[76.0,0.468,0.793,2.7,20.2,7.1,2.7,1.0,1.9,2.3]],["K. George","UTA","PG,SG",[67.0,0.448,0.865,2.0,17.7,3.8,6.1,1.0,0.2,3.1]],["M. Porter Jr.","BKN","SF,PF",[65.0,0.47,0.826,3.1,21.8,7.1,2.6,1.0,0.4,2.0]],["D. Murray","NOP","PG",[65.0,0.439,0.82,1.7,16.3,6.3,6.3,1.6,0.3,3.4]],["K. Ware","MIL","C",[76.0,0.529,0.718,1.4,14.2,9.6,1.1,0.9,1.4,1.1]],["J. Embiid","PHI","C",[49.0,0.488,0.866,1.2,24.5,7.5,3.9,0.6,1.2,2.5]],["Z. Williamson","NOP","PF,C",[64.0,0.606,0.7,0.0,23.0,6.1,4.1,1.0,0.6,2.4]],["A. Sarr","WAS","C",[70.0,0.481,0.685,0.1,14.8,6.9,2.9,0.8,1.7,2.0]],["I. Zubac","IND","C",[72.0,0.617,0.692,0.0,14.5,11.0,2.2,0.5,1.0,1.6]],["N. Reid","CHA","PF,C",[76.0,0.461,0.746,2.4,15.3,6.6,2.3,0.9,1.1,1.6]],["B. Ingram","LAC","SG,SF,PF",[68.0,0.477,0.816,1.8,21.8,5.5,4.3,0.8,0.7,2.6]],["P. Pritchard","BOS","PG",[78.0,0.467,0.871,3.0,18.6,4.2,4.9,0.8,0.1,1.3]],["D. Queen","NOP","PF,C",[76.0,0.488,0.795,0.4,14.5,8.3,4.3,1.2,1.1,2.8]],["D. Fox","SAS","PG",[69.0,0.471,0.777,1.8,18.2,3.9,5.6,1.3,0.3,2.3]],["Z. Edey","MEM","C",[60.0,0.613,0.76,0.3,15.3,11.4,1.3,0.7,2.2,2.5]],["V. Edgecombe","PHI","PG,SG",[77.0,0.438,0.82,2.0,15.9,6.1,4.5,1.5,0.6,2.0]],["J. McDaniels","MIN","SF",[75.0,0.51,0.818,1.4,15.8,4.9,3.0,1.2,1.0,1.6]],["O. Anunoby","NYK","SF,PF",[70.0,0.48,0.814,2.3,16.5,5.0,2.1,1.4,0.7,1.6]],["M. Bridges","NYK","SF,PF",[82.0,0.48,0.815,2.0,14.9,3.5,3.5,1.1,0.6,1.3]],["R. Gobert","MIN","C",[73.0,0.672,0.592,0.0,11.1,10.8,1.5,0.7,1.5,1.3]],["C. White","CHA","PG,SG",[69.0,0.449,0.853,2.6,18.9,3.7,5.8,0.7,0.2,2.4]],["C. Wilson","CHI","PF",[75.0,0.505,0.718,0.6,14.9,7.6,2.6,1.1,1.1,2.1]],["D. Harper","SAS","PG,SG",[69.0,0.507,0.758,1.2,16.7,4.8,4.8,1.2,0.5,2.1]],["A. Dybantsa","WAS","SF",[78.0,0.461,0.771,1.2,17.4,5.8,3.1,1.0,0.4,2.6]],["J. Allen","CLE","C",[68.0,0.661,0.718,0.0,14.3,9.1,2.0,0.9,0.9,1.3]],["C. Coward","MEM","SG,SF",[70.0,0.478,0.832,2.0,18.7,7.1,3.8,0.9,0.6,2.4]],["I. Quickley","TOR","PG,SG",[71.0,0.432,0.836,2.5,15.3,3.9,5.7,1.1,0.1,1.5]],["T. Jerome","MEM","PG,SG",[67.0,0.494,0.874,2.6,17.2,3.5,6.1,1.3,0.1,1.9]],["D. Lillard","POR","PG",[62.0,0.436,0.921,2.7,18.7,6.0,5.3,0.8,0.1,2.1]],["D. Peterson","UTA","SG",[73.0,0.453,0.827,1.8,16.9,4.7,3.2,1.2,0.6,1.9]],["M. Bridges","PHX","PF",[71.0,0.444,0.837,2.0,17.3,6.8,3.4,0.7,0.5,1.7]],["J. Hart","NYK","SG,SF",[72.0,0.498,0.752,1.5,11.8,7.8,4.3,1.2,0.3,1.8]],["N. Claxton","CHI","C",[69.0,0.61,0.576,0.1,12.6,8.1,3.1,0.8,1.5,1.4]],["D. Sharpe","BKN","C",[66.0,0.553,0.66,0.2,11.1,9.2,2.9,1.5,0.5,1.9]],["A. Thompson","DET","SG,SF,PF",[66.0,0.525,0.592,0.2,11.7,6.2,3.4,2.1,1.0,1.7]],["J. Morant","POR","PG",[58.0,0.437,0.849,1.2,16.9,3.1,5.7,1.1,0.3,3.4]],["J. Smith Jr.","HOU","PF,C",[73.0,0.447,0.791,2.2,15.7,7.3,1.7,0.7,0.9,1.4]],["A. Wiggins","MIA","SG,SF,PF",[68.0,0.458,0.77,2.0,15.5,4.9,2.6,1.0,0.9,1.6]],["J. Green","PHX","SG,SF",[72.0,0.42,0.79,2.7,20.0,4.4,3.5,1.0,0.3,2.5]],["N. Powell","CHI","SG,SF",[66.0,0.47,0.82,2.6,19.8,3.2,2.0,1.0,0.2,1.7]],["P. George","BOS","SF,PF",[59.0,0.446,0.856,2.3,15.0,4.5,3.2,1.4,0.4,1.7]],["J. Suggs","ORL","PG,SG",[64.0,0.431,0.839,2.1,14.1,3.8,5.0,1.7,0.7,2.5]],["C. McCollum","ATL","PG,SG",[73.0,0.452,0.76,2.5,17.4,3.2,3.7,0.8,0.4,1.6]],["D. Acuff Jr.","SAC","PG",[76.0,0.409,0.797,2.0,17.1,3.6,4.5,0.8,0.4,2.1]],["M. Turner","MIL","C",[68.0,0.468,0.759,1.9,12.6,5.7,1.4,0.6,1.7,1.3]],["J. Jaquez Jr.","MIL","SG,SF,PF",[75.0,0.542,0.805,1.1,16.4,5.4,4.8,1.0,0.2,1.1]],["B. Podziemski","GSW","PG,SG",[74.0,0.449,0.776,1.9,13.0,5.5,3.9,1.1,0.2,1.5]],["K. George","WAS","SG,SF,PF",[68.0,0.432,0.787,1.9,12.4,5.1,3.9,1.1,0.9,2.2]],["A. Dosunmu","MIN","PG,SG",[71.0,0.49,0.847,1.7,15.0,3.6,3.7,0.9,0.4,1.5]],["R. Barrett","TOR","SG,SF,PF",[64.0,0.472,0.684,1.8,17.3,5.5,3.0,0.7,0.3,1.8]],["K. Murray","SAC","SF,PF",[70.0,0.44,0.816,2.0,13.7,6.2,1.6,0.9,1.0,0.9]],["T. Camara","POR","SF,PF",[79.0,0.443,0.719,2.2,12.3,5.3,2.2,1.2,0.5,1.6]],["I. Hartenstein","OKC","C",[63.0,0.607,0.648,0.0,9.1,9.2,3.2,0.9,0.9,1.5]],["K. Porter Jr.","MIL","PG,SG",[60.0,0.458,0.832,1.0,13.9,4.5,5.3,1.6,0.3,2.4]],["R. Sheppard","HOU","PG,SG",[75.0,0.446,0.8,2.6,13.1,2.9,3.3,1.4,0.6,1.5]],["S. Bey","NOP","SF,PF",[70.0,0.441,0.84,2.0,15.6,5.6,2.2,0.9,0.1,0.9]],["D. Mitchell","MIA","PG",[71.0,0.463,0.675,1.3,9.4,2.7,7.2,1.2,0.4,1.6]],["A. Black","ORL","PG,SG,SF",[69.0,0.463,0.762,1.5,14.7,3.7,3.6,1.3,0.7,2.0]],["J. Nurkić","UTA","C",[55.0,0.5,0.613,0.6,11.1,10.4,4.0,1.1,0.8,2.4]],["C. Murray-Boyles","TOR","PF,C",[70.0,0.58,0.656,0.4,10.4,6.1,2.3,1.1,1.1,1.4]],["N. Queta","BOS","C",[65.0,0.651,0.712,0.0,9.9,8.0,1.6,0.7,1.3,1.0]],["Q. Grimes","LAL","SG,SF",[71.0,0.441,0.81,2.4,15.5,3.8,3.2,1.0,0.4,1.9]],["Y. Lendeborg","GSW","PF",[74.0,0.467,0.808,1.2,11.4,5.5,2.5,1.0,0.9,1.2]],["J. Collins","DET","PF,C",[65.0,0.542,0.799,1.4,15.6,6.8,1.3,0.9,0.8,1.7]],["J. Fears","NOP","PG,SG",[78.0,0.43,0.799,1.4,15.0,4.1,3.8,1.3,0.4,2.4]],["S. Mamukelashvili","LAL","PF,C",[74.0,0.48,0.744,1.9,12.2,5.9,2.2,0.8,0.4,1.4]],["P. Watson","CLE","SF,PF",[71.0,0.476,0.719,1.3,12.4,4.6,2.1,0.8,1.4,1.3]],["C. Braun","DEN","SG,SF,PF",[74.0,0.54,0.789,1.1,13.3,5.1,2.6,1.0,0.4,1.0]],["M. Raynaud","SAC","C",[74.0,0.571,0.787,0.3,12.2,7.2,1.2,0.5,0.5,1.2]],["W. Carter Jr.","ORL","C",[68.0,0.504,0.749,0.9,11.0,7.4,2.0,0.8,0.6,1.2]],["K. Maluach","PHX","C",[68.0,0.567,0.743,0.2,5.0,4.4,0.4,0.2,1.0,0.6]],["A. Mitchell","OKC","PG,SG",[65.0,0.485,0.869,1.1,13.6,3.4,3.9,1.3,0.3,1.5]],["E. Dëmin","BKN","PG,SG",[70.0,0.407,0.827,2.8,12.7,3.8,4.0,1.0,0.4,2.0]],["C. Gillespie","PHX","PG,SG",[70.0,0.42,0.865,2.7,11.8,3.9,4.4,1.2,0.2,1.4]],["A. Nembhard","IND","PG,SG",[66.0,0.454,0.815,1.3,13.1,2.8,6.1,1.0,0.1,2.0]],["F. VanVleet","HOU","PG",[60.0,0.392,0.847,2.3,12.3,3.2,5.2,1.2,0.4,1.2]],["K. Wagler","LAC","SG",[75.0,0.46,0.797,1.7,13.8,3.8,4.2,1.0,0.2,1.9]],["Z. LaVine","SAC","PG,SG,SF",[67.0,0.491,0.847,2.4,16.9,3.1,2.8,0.6,0.2,2.0]],["M. Brown Jr.","BKN","PG",[74.0,0.409,0.773,1.7,13.2,3.7,4.2,0.8,0.2,1.6]],["I. Stewart","MEM","PF,C",[68.0,0.537,0.755,0.9,11.6,6.4,1.6,0.4,1.5,1.3]],["P. Washington","DAL","PF,C",[62.0,0.448,0.699,1.5,13.6,6.7,1.9,1.0,1.0,1.7]],["M. Williams","PHX","C",[64.0,0.631,0.776,0.0,13.2,9.0,1.5,0.9,1.0,1.3]],["A. Gordon","DEN","PF,C",[65.0,0.515,0.756,1.6,15.6,5.7,3.1,0.6,0.4,1.3]],["J. Butler III","GSW","SF,PF",[35.0,0.509,0.854,0.6,15.8,3.4,4.2,1.1,0.2,1.2]],["D. DeRozan","DEN","SF,PF",[74.0,0.486,0.863,0.6,14.3,2.4,3.1,0.7,0.3,0.9]],["A. Bailey","UTA","SF,PF",[72.0,0.451,0.769,1.8,13.8,4.6,2.0,0.9,0.7,1.6]],["J. Holiday","POR","PG,SG",[68.0,0.454,0.849,1.9,12.2,4.1,4.5,0.9,0.3,1.8]],["C. Sexton","LAL","PG,SG",[68.0,0.481,0.86,1.9,17.6,2.8,4.0,1.1,0.2,2.5]],["C. Wallace","OKC","PG,SG,SF",[73.0,0.452,0.796,1.3,8.6,3.2,2.5,1.8,0.4,0.9]],["D. Vassell","SAS","SG,SF",[69.0,0.433,0.803,2.4,13.4,3.9,2.8,1.0,0.4,1.1]],["K. Filipowski","UTA","PF,C",[75.0,0.495,0.718,1.0,10.3,6.5,2.2,0.8,0.4,1.5]],["D. Green","GSW","PF,C",[65.0,0.431,0.691,1.2,8.2,5.7,5.4,1.0,0.8,2.5]],["K. Porziņģis","GSW","C",[55.0,0.474,0.834,1.9,16.7,5.0,2.4,0.6,1.2,1.2]],["B. Burries","MIL","SG",[75.0,0.445,0.89,1.3,12.1,3.8,2.4,1.0,0.4,1.1]],["T. Hardaway Jr.","MIA","SG,SF",[75.0,0.444,0.572,2.7,13.0,2.7,1.6,1.0,0.9,1.1]],["T. Eason","HOU","SG,SF,PF",[60.0,0.444,0.756,1.4,11.8,6.8,1.6,1.5,0.7,1.3]],["B. Mathurin","NOP","SG,SF",[65.0,0.442,0.849,1.3,16.2,5.0,2.1,0.7,0.3,1.9]],["B. Portis","MIA","PF,C",[63.0,0.485,0.769,1.7,13.7,7.1,1.6,0.7,0.3,1.0]],["G. Allen","CHA","SG,SF",[68.0,0.432,0.85,2.8,13.7,3.2,3.0,1.1,0.3,1.4]],["D. Brooks","PHX","SF,PF",[70.0,0.432,0.837,2.2,15.9,3.5,1.7,0.9,0.2,1.3]],["I. Collier","UTA","PG,SG",[63.0,0.465,0.759,0.5,8.0,2.1,4.8,0.6,0.3,1.5]],["J. Huff","IND","C",[65.0,0.486,0.812,0.1,6.7,3.0,1.1,0.4,1.4,0.7]],["K. Johnson","SAS","SF,PF",[78.0,0.496,0.785,1.3,13.2,5.1,1.6,0.6,0.2,1.0]],["J. Wells","MEM","SG,SF",[73.0,0.443,0.594,2.0,12.2,3.5,1.6,0.5,1.8,1.2]],["J. Champagnie","SAS","SF,PF",[78.0,0.426,0.85,2.2,10.2,4.4,1.5,0.7,0.5,0.9]],["K. Kuzma","MIL","SF,PF",[71.0,0.453,0.788,1.5,14.7,5.1,2.5,1.1,0.3,1.2]],["P. Reed","DET","PF,C",[66.0,0.568,0.713,0.3,8.7,5.6,1.6,1.1,1.1,1.1]],["S. Pippen Jr.","MEM","PG",[65.0,0.48,0.74,1.3,12.2,3.2,4.6,1.7,0.4,2.5]],["J. Beringer","MIN","PF,C",[69.0,0.682,0.72,0.0,6.4,4.4,0.6,0.6,1.0,0.7]],["R. Williams III","POR","C",[45.0,0.691,0.651,0.1,6.5,6.8,1.0,0.6,1.5,0.8]],["J. Poeltl","TOR","C",[58.0,0.658,0.623,0.0,8.9,6.6,2.1,0.8,0.7,1.3]],["K. Oubre Jr.","IND","SF,PF",[68.0,0.455,0.757,1.2,11.7,4.6,1.4,1.2,0.4,1.1]],["T. Harris","SAS","PF",[71.0,0.47,0.868,1.1,11.4,4.5,2.1,0.8,0.5,1.0]],["S. Aldama","DAL","PF",[68.0,0.472,0.661,1.5,10.9,5.5,2.4,0.7,0.5,1.0]],["M. Johnson Jr.","DAL","PF",[75.0,0.589,0.736,0.3,8.4,5.0,1.0,0.9,1.0,1.0]],["W. Riley","WAS","SF,PF",[74.0,0.482,0.796,1.0,8.4,2.3,1.2,0.3,0.1,0.7]],["C. Johnson","DEN","SF,PF",[55.0,0.478,0.861,2.1,13.1,4.0,2.7,0.8,0.4,1.2]],["J. Grant","MEM","SF,PF",[59.0,0.424,0.82,2.4,16.7,3.3,2.2,0.7,0.7,1.8]],["K. Flemings","ATL","PG",[74.0,0.438,0.836,0.8,9.4,3.0,3.8,0.9,0.4,1.3]],["D. Gafford","DAL","C",[58.0,0.686,0.681,0.0,9.4,6.6,1.2,0.6,1.4,1.1]],["D. Ayton","WAS","C",[66.0,0.618,0.667,0.0,9.3,6.9,0.9,0.5,0.7,1.1]],["N. Marshall","DAL","SG,SF,PF",[71.0,0.505,0.773,0.8,11.9,4.1,2.6,0.9,0.1,1.4]],["O. Dieng","MIL","SF,PF",[65.0,0.423,0.738,1.2,8.1,3.5,2.2,0.6,0.4,1.4]],["S. Henderson","POR","PG",[65.0,0.465,0.824,1.7,13.5,3.0,3.4,1.0,0.5,0.7]],["A. Wiggins","ATL","SG,SF",[70.0,0.442,0.774,1.7,11.2,3.5,4.4,1.3,0.2,1.4]],["D. Melton","GSW","PG,SG",[60.0,0.416,0.818,1.9,13.1,3.5,2.8,1.6,0.4,1.8]],["P. Larsson","MIA","SG,SF",[70.0,0.492,0.792,0.9,11.6,3.4,3.3,0.8,0.3,1.4]],["T. Jones","CHI","PG,SG",[60.0,0.54,0.839,0.6,11.6,3.1,5.3,1.1,0.2,1.3]],["J. LaRavia","LAL","SF,PF",[68.0,0.461,0.777,1.2,9.8,4.7,2.5,1.4,0.5,0.5]],["M. Diabaté","CHA","C",[65.0,0.604,0.645,0.0,6.9,7.7,1.8,0.7,0.9,1.1]],["A. Drummond","NYK","C",[67.0,0.637,0.623,0.3,8.4,8.2,1.8,1.0,0.3,0.9]],["C. Spencer","MEM","PG,SG",[67.0,0.452,0.917,1.8,10.2,2.5,5.2,0.7,0.1,1.3]],["K. Jakučionis","MIL","PG,SG",[75.0,0.419,0.839,1.8,10.1,4.2,4.4,0.9,0.3,1.6]],["H. Jones","NOP","SG,SF",[65.0,0.42,0.825,1.4,9.6,3.5,2.8,1.6,0.6,1.3]],["P. Achiuwa","SAC","PF,C",[69.0,0.516,0.605,0.3,8.8,6.4,1.1,1.0,0.7,0.9]],["J. Shead","TOR","PG",[79.0,0.397,0.827,1.2,8.1,1.9,5.2,1.0,0.4,1.4]],["H. Steinbach","CHA","PF",[70.0,0.478,0.759,0.3,8.2,5.3,1.0,0.5,0.8,1.0]],["S. Sharpe","POR","PG,SG",[60.0,0.45,0.786,2.0,18.6,4.1,2.5,1.1,0.1,2.4]],["R. O'Neale","CHA","SF,PF",[76.0,0.415,0.7,2.2,8.2,4.7,2.3,0.9,0.4,1.0]],["M. Robinson","BOS","C",[63.0,0.691,0.434,0.0,5.6,8.3,0.8,1.0,1.1,0.7]],["N. Clifford","SAC","SG,SF",[75.0,0.437,0.733,1.1,9.7,4.1,2.5,0.9,0.4,1.6]],["J. Williams","OKC","PF,C",[59.0,0.417,0.785,1.4,6.5,5.4,1.2,0.9,0.2,0.6]],["R. Kalkbrenner","CHA","C",[69.0,0.753,0.71,0.0,6.5,4.7,0.7,0.4,1.3,0.8]],["D. Robinson","DET","SG,SF",[70.0,0.427,0.8,2.7,11.3,2.4,3.1,1.3,0.3,1.6]],["A. Simons","PHI","PG,SG",[68.0,0.427,0.901,2.5,13.5,2.3,3.2,0.5,0.1,1.5]],["R. Westbrook","SAC","PG,SG",[65.0,0.469,0.745,1.2,11.2,3.9,1.9,1.1,0.4,1.1]],["S. Hauser","BOS","SF,PF",[75.0,0.438,0.625,2.5,9.1,3.4,2.6,1.1,0.8,1.9]],["A. Nesmith","IND","SG,SF",[65.0,0.456,0.835,2.1,12.7,4.0,1.6,0.8,0.5,1.1]],["B. Coulibaly","WAS","SG,SF",[58.0,0.427,0.739,1.1,10.7,4.2,2.5,1.2,0.9,1.6]],["M. Christie","DAL","SG,SF",[73.0,0.435,0.875,2.3,12.5,3.6,2.6,0.6,0.3,3.0]],["R. Holland II","DET","SF,PF",[79.0,0.466,0.687,0.7,8.4,3.8,1.1,1.0,0.8,0.5]],["N. Ament","MIL","SF",[75.0,0.425,0.789,1.0,10.3,3.9,1.6,0.8,0.5,1.3]],["G. Santos","GSW","SF,PF",[71.0,0.482,0.7,1.0,7.3,3.7,2.1,0.8,0.2,1.0]],["T. Shannon Jr.","MIN","SG,SF",[74.0,0.45,0.814,1.4,11.2,2.7,2.0,0.7,0.2,1.1]],["D. Swain","CHI","SF",[75.0,0.464,0.812,0.7,9.2,4.4,1.8,0.9,0.3,1.2]],["M. Monk","SAC","PG,SG",[64.0,0.443,0.863,1.7,11.7,2.2,3.4,0.6,0.4,1.5]],["D. Cardwell","SAC","PF,C",[72.0,0.579,0.507,0.0,4.7,6.7,1.2,0.6,1.3,0.8]],["B. Lopez","LAC","C",[72.0,0.458,0.797,1.4,8.3,3.1,1.1,0.4,1.1,0.7]],["D. Jenkins","DET","PG,SG",[70.0,0.431,0.832,0.9,9.2,2.2,3.9,0.8,0.5,0.7]],["M. Strus","LAC","SF,PF",[63.0,0.44,0.804,2.6,11.1,4.8,2.9,0.6,0.2,1.0]],["J. Walker","IND","SF,PF",[70.0,0.424,0.799,1.6,10.3,4.4,2.0,0.9,0.4,1.5]],["O. Toppin","IND","SF,PF",[76.0,0.534,0.813,1.3,10.1,3.9,1.7,0.5,0.3,0.9]],["T. da Silva","ORL","SF,PF",[75.0,0.45,0.75,1.8,10.3,3.8,1.4,0.7,0.4,1.1]],["A. Mara","OKC","C",[70.0,0.533,0.584,0.1,5.0,4.8,1.4,0.4,1.1,1.0]],["T. McConnell","IND","PG",[69.0,0.521,0.792,0.2,8.5,2.2,4.4,0.9,0.2,1.2]],["J. Tyson","CLE","SG,SF,PF",[69.0,0.472,0.723,1.5,10.6,4.5,0.9,0.8,0.3,0.8]],["T. Hendricks","MEM","PF,C",[71.0,0.466,0.719,1.1,8.5,3.5,1.2,1.2,0.8,1.3]],["Y. Missi","NOP","C",[68.0,0.615,0.698,0.0,6.7,5.7,1.2,0.9,0.4,0.7]],["Z. Risacher","DAL","SF,PF",[66.0,0.464,0.846,1.4,9.3,3.2,1.6,0.6,0.1,1.4]],["A. Bona","PHI","C",[65.0,0.662,0.709,0.0,6.8,5.4,0.6,0.6,1.4,1.0]],["T. Johnson","WAS","PG,SG,SF",[60.0,0.425,0.852,2.0,11.7,2.9,4.4,0.8,0.1,0.8]],["J. Kuminga","MIN","SF,PF",[68.0,0.476,0.665,0.8,11.6,4.1,1.9,0.6,0.4,1.7]],["N. Vučević","ORL","C",[69.0,0.504,0.817,0.8,8.6,4.8,1.7,0.3,0.3,0.8]],["M. Cisse","DAL","C",[38.0,0.633,0.714,0.0,5.6,5.9,0.8,0.3,0.3,0.4]],["M. Bagley III","DEN","PF,C",[48.0,0.55,0.747,0.2,7.8,4.8,1.0,0.4,0.2,0.4]],["I. Joe","DET","SG,SF",[73.0,0.447,0.871,2.6,10.7,2.5,1.5,0.7,0.2,0.6]],["S. Merrill","CLE","SG,SF",[61.0,0.426,0.902,2.6,10.0,2.4,2.0,0.7,0.1,0.7]],["S. James","CHA","SG,SF",[82.0,0.453,0.837,1.0,6.5,3.7,2.3,0.6,0.3,0.8]],["J. McCain","OKC","PG,SG",[67.0,0.442,0.788,2.0,12.2,2.7,2.0,0.7,0.1,1.3]],["D. Lively II","DAL","C",[50.0,0.71,0.609,0.0,8.6,7.3,1.9,0.6,1.6,1.2]],["K. Dunn","LAC","PG,SG",[74.0,0.462,0.75,0.9,6.3,3.1,3.2,1.5,0.2,1.1]],["L. Kornet","SAS","C",[68.0,0.658,0.786,0.0,6.2,5.6,1.7,0.5,1.0,0.4]],["M. McBride","NYK","PG,SG",[66.0,0.42,0.814,2.3,10.9,2.4,2.7,1.0,0.2,0.7]],["B. Scheierman","BOS","SG,SF",[78.0,0.429,0.878,1.6,6.8,4.2,1.8,0.7,0.2,0.8]],["K. Thompson","MIA","SG,SF",[67.0,0.408,0.729,2.2,9.8,2.0,3.3,1.2,0.3,1.2]],["R. Hachimura","LAC","SF,PF",[65.0,0.517,0.73,1.5,11.4,3.7,1.0,0.6,0.3,0.6]],["L. Dort","ATL","SG,SF",[71.0,0.413,0.771,2.1,9.4,3.7,1.4,1.0,0.5,0.8]],["I. Jackson","LAC","C",[55.0,0.612,0.672,0.0,7.2,5.5,1.0,0.7,1.0,1.0]],["J. Landale","ATL","C",[57.0,0.515,0.805,0.8,8.5,4.7,1.1,0.3,0.2,0.8]],["G. Jackson","MEM","SF,PF,C",[67.0,0.448,0.711,1.2,10.7,3.8,0.9,0.8,0.5,2.1]]];
  const CURRENT_VERSION = "1.12";
  const RAW_URL = 'https://raw.githubusercontent.com/JWangDes/Fantasy-Basketball-Cheat-Sheet/main/jasons-cheat-sheet.user.js';

  const CATS = ['FG%', 'FT%', '3PM', 'PTS', 'REB', 'AST', 'STL', 'BLK', 'TO'];
  const ROSTER = 13;
  const m = location.pathname.match(/draftclient\/nba\/(\d+)\/(\d+)/);
  const LEAGUE = m ? m[1] : null, MY_TEAM = m ? +m[2] : null;

  const S = { picks: new Map(), onClock: null, order: [], players: new Map(), ready: false, err: null, mode: 'fit', collapsed: false, query: '', newVersion: null };

  // ---------- 0. check GitHub for a newer version as soon as the draft room opens ----------
  async function checkForUpdate() {
    try {
      const r = await fetch(RAW_URL + '?t=' + Date.now(), { cache: 'no-store' });
      if (!r.ok) return;
      const text = await r.text();
      const v = (text.match(/@version\s+(\S+)/) || [])[1];
      if (v && v !== CURRENT_VERSION) { S.newVersion = v; schedule(); }
    } catch (e) {} // offline / blocked: silently skip, Tampermonkey's own periodic check still applies
  }

  // ---------- 1. listen to the draft server ----------
  function handle(line) {
    const p = line.split('|');
    switch (p[0]) {
      case 'P': // pick history on connect: P|pick=playerId,team,x|...
        p.slice(1).forEach(s => { const [pk, rest] = s.split('='); if (!rest) return; const [pid, tm] = rest.split(','); S.picks.set(+pk, { pid: +pid, team: +tm }); });
        break;
      case '0': // live pick: 0|pick|playerId|team|slot|x
        S.picks.set(+p[1], { pid: +p[2], team: +p[3] }); break;
      case 'D': S.onClock = { pick: +p[1], team: +p[2] }; break;
      case 'R': S.order = p.slice(1).map(Number); break;
      default: return;
    }
    schedule();
  }

  // Three independent ways to see picks, so one failing doesn't break sync.
  const W0 = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;
  const seen = new WeakSet();
  const feed = (ev) => {
    try {
      if (!ev || seen.has(ev)) return; seen.add(ev);
      const v = ev.__fhData !== undefined ? ev.__fhData : ev.data;
      if (typeof v === 'string') v.split('\n').forEach(l => { try { handle(l.trim()); } catch (e) {} });
    } catch (e) {}
  };
  // (a) wrap the WebSocket constructor so every new socket reports to us
  try {
    const NativeWS = W0.WebSocket;
    const Wrapped = function (url, protocols) {
      const ws = protocols === undefined ? new NativeWS(url) : new NativeWS(url, protocols);
      try { ws.addEventListener('message', feed); } catch (e) {}
      S.sockets = (S.sockets || 0) + 1;
      return ws;
    };
    Wrapped.prototype = NativeWS.prototype;
    ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'].forEach(k => { try { Wrapped[k] = NativeWS[k]; } catch (e) {} });
    W0.WebSocket = Wrapped;
  } catch (e) {}
  // (b) catch messages as the page reads them (covers sockets opened before this script ran)
  function hookData() {
    try {
      const proto = W0.MessageEvent.prototype;
      const cur = Object.getOwnPropertyDescriptor(proto, 'data');
      if (!cur || !cur.get || cur.get.__fh) return;
      const orig = cur.get;
      const g = function () {
        const v = orig.call(this);
        try { if (typeof v === 'string' && this.target && this.target.constructor && /WebSocket/.test(this.target.constructor.name || '') && !seen.has(this)) { seen.add(this); v.split('\n').forEach(l => { try { handle(l.trim()); } catch (e) {} }); } } catch (e) {}
        return v;
      };
      g.__fh = true;
      Object.defineProperty(proto, 'data', { configurable: true, enumerable: cur.enumerable, get: g });
    } catch (e) {}
  }
  hookData(); setInterval(hookData, 3000);

  // ---------- 2. load Yahoo's player list (ids, names, ADP, last season FGA/FTA) ----------
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[.']/g, '').replace(/\s+(jr|sr|ii|iii|iv)$/, '').trim();
  const keyOf = (initial, last) => norm(initial)[0] + ' ' + norm(last);

  // ADP from a handful of drafts is noise (a 2%-drafted player can show ADP 44). Trust it in proportion to how often he's drafted.
  function effectiveAdp(y) {
    const num = v => { const n = parseFloat(v); return n > 0 ? n : null; };
    const adp = num(y['last7days-average-pick']) || num(y['average-pick']);
    const pct = parseFloat(y['percent-drafted']) || 0;
    const rank = num(y.o_rank) || 400;
    if (!adp) return Math.max(rank, 150);
    if (pct >= 0.6) return adp;
    const floor = Math.max(rank, 140);          // rarely drafted: fall back toward Yahoo's overall rank
    return adp * pct + Math.max(adp, floor) * (1 - pct);
  }

  async function loadPlayers(attempt = 1) {
    try {
      const API = `https://pub-api.fantasysports.yahoo.com/fantasy/v3/players/nba/${LEAGUE}?format=rawjson`;
      let r = await fetch(API + '&projected=1&average=1', { credentials: 'include' }); // same call Yahoo's draft room makes
      if (!r.ok) r = await fetch(API, { credentials: 'include' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const list = (await r.json()).service.player_list;
      const projByKey = new Map(); // "initial last|TEAM" -> [[pos, projection], ...]
      PROJ.forEach(([n, tm, pos, pr]) => {
        const [ini, ...rest] = n.split(' ');
        const k = keyOf(ini, rest.join(' ')) + '|' + tm;
        (projByKey.get(k) || projByKey.set(k, []).get(k)).push([pos, pr]);
      });
      list.forEach(y => {
        const ss = y.season_stats || {}; const num = k => parseFloat(ss[k]);
        const cands = projByKey.get(keyOf(y.fname || '?', y.lname || '') + '|' + y.team_abbr) || [];
        const hit = cands.length === 1 ? cands[0] : cands.find(c => c[0] === y.display_pos); // same name + team: match by position
        const pr = hit ? hit[1] : null;
        const lastGP = num('0') || 0;
        const ps = y.projected_stats || {}; const pj = k => parseFloat(ps[k]); const pGP = pj('0') || 0;
        // per-game line: Yahoo live 2026-27 projections > saved projections > last season
        let line = null, src = 'last';
        if (pGP > 0 && pj('12') >= 0) {
          line = { gp: pGP, fgp: pj('5'), ftp: pj('8'), tpm: pj('10') / pGP, pts: pj('12') / pGP, reb: pj('15') / pGP, ast: pj('16') / pGP, stl: pj('17') / pGP, blk: pj('18') / pGP, to: pj('19') / pGP,
            fga: pj('3') / pGP, fta: pj('6') / pGP };
          if (!(line.fga > 0)) delete line.fga;
          if (!(line.fta > 0)) delete line.fta;
          src = 'live';
        } else if (pr) { src = 'saved'; line = { gp: pr[0], fgp: pr[1], ftp: pr[2], tpm: pr[3], pts: pr[4], reb: pr[5], ast: pr[6], stl: pr[7], blk: pr[8], to: pr[9] }; }
        if (!line && lastGP > 10) line = { gp: lastGP, fgp: num('5'), ftp: num('8'), tpm: num('10') / lastGP, pts: num('12') / lastGP, reb: num('15') / lastGP, ast: num('16') / lastGP, stl: num('17') / lastGP, blk: num('18') / lastGP, to: num('19') / lastGP };
        if (line && line.fga !== undefined && line.fta !== undefined) { /* real projected attempts */ }
        else if (line) {
          // shot attempts per game: last season's real rate, scaled to projected scoring
          if (lastGP > 10 && num('3') > 0 && num('12') > 0) {
            const scale = line.pts / (num('12') / lastGP);
            line.fga = num('3') / lastGP * scale; line.fta = num('6') / lastGP * scale;
          } else { // no history: estimate from points
            const ftm = 0.18 * line.pts; line.fta = ftm / (line.ftp || 0.78); line.fga = Math.max(0.5, (line.pts - line.tpm - ftm) / 2) / (line.fgp || 0.46);
          }
        }
        if (line) ['fgp', 'ftp'].forEach(f => { if (!(line[f] > 0)) line[f] = f === 'fgp' ? 0.46 : 0.78; });
        S.players.set(+y.id, {
          id: +y.id, name: `${(y.fname || '')[0] || ''}. ${y.lname}`, full: `${y.fname} ${y.lname}`, team: y.team_abbr, pos: y.display_pos || '',
          inj: y.inj || '', adp: effectiveAdp(y), line, src
        });
      });
      buildBaseline(); S.ready = true;
    } catch (e) {
      if (attempt < 6) { S.err = `Loading players (retry ${attempt})…`; setTimeout(() => loadPlayers(attempt + 1), 3000); }
      else S.err = 'Could not load Yahoo player data (' + (e.message || e) + '). Refresh the draft page.';
    }
    schedule();
  }

  // (c) fallback: read your roster straight from Yahoo's "YOUR TEAM" panel
  const DOM_MINE = new Set();
  function readYourTeamPanel() {
    if (!S.ready) return;
    try {
      const hdr = [...document.querySelectorAll('body *')].find(e => /^YOUR TEAM \(\d+\/\d+\)$/i.test((e.textContent || '').trim()) && e.children.length < 3);
      if (!hdr) return;
      let box = hdr; for (let i = 0; i < 4 && box && !/BN/.test(box.innerText || ''); i++) box = box.parentElement;
      if (!box) return;
      const txt = box.innerText || '';
      const re = /([A-Z][A-Za-z'’\-]*)\.\s+([^\n]+?)\s*\n\s*[A-Z,]+\s*[•·]\s*([A-Z]{2,4})/g;
      let mm, found = new Set();
      while ((mm = re.exec(txt))) {
        const k = keyOf(mm[1], mm[2]); const team = mm[3];
        const hit = [...S.players.values()].find(p => keyOf(p.name.split('.')[0], p.name.split('. ').slice(1).join('. ')) === k && p.team === team);
        if (hit) found.add(hit.id);
      }
      let changed = found.size !== DOM_MINE.size || [...found].some(id => !DOM_MINE.has(id));
      if (changed) { DOM_MINE.clear(); found.forEach(id => DOM_MINE.add(id)); schedule(); }
    } catch (e) {}
  }
  setInterval(readYourTeamPanel, 2000);

  // ---------- 3. team totals and category ranks ----------
  let AVG = null; // average drafted player (top 156 by ADP) used to fill empty roster spots
  function buildBaseline() {
    const pool = [...S.players.values()].filter(p => p.line).sort((a, b) => a.adp - b.adp).slice(0, 156);
    const keys = ['gp', 'fgp', 'ftp', 'tpm', 'pts', 'reb', 'ast', 'stl', 'blk', 'to', 'fga', 'fta'];
    AVG = {}; keys.forEach(k => AVG[k] = pool.reduce((s, p) => s + p.line[k], 0) / pool.length);
  }
  function totals(lines) {
    const all = lines.slice(0, ROSTER); while (all.length < ROSTER) all.push(AVG);
    const t = { fgm: 0, fga: 0, ftm: 0, fta: 0, tpm: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0 };
    all.forEach(l => {
      const g = l.gp;
      t.fga += l.fga * g; t.fgm += l.fga * l.fgp * g; t.fta += l.fta * g; t.ftm += l.fta * l.ftp * g;
      ['tpm', 'pts', 'reb', 'ast', 'stl', 'blk', 'to'].forEach(k => t[k] += l[k] * g);
    });
    return [t.fgm / t.fga, t.ftm / t.fta, t.tpm, t.pts, t.reb, t.ast, t.stl, t.blk, t.to];
  }
  function rosters() {
    const R = new Map(); for (let t = 1; t <= 12; t++) R.set(t, []);
    [...S.picks.entries()].sort((a, b) => a[0] - b[0]).forEach(([, v]) => {
      const p = S.players.get(v.pid); if (!R.has(v.team)) R.set(v.team, []);
      R.get(v.team).push(p && p.line ? p.line : AVG);
    });
    const socketMine = [...S.picks.values()].filter(v => v.team === MY_TEAM).length;
    if (DOM_MINE.size > socketMine) R.set(MY_TEAM, [...DOM_MINE].map(id => { const p = S.players.get(id); return p && p.line ? p.line : AVG; }));
    return R;
  }
  function rankOf(myVals, others, c) {
    const better = others.filter(o => c === 8 ? o[c] < myVals[c] : o[c] > myVals[c]).length;
    return better + 1;
  }
  function analyze(extraLine) {
    const R = rosters();
    const mine = (R.get(MY_TEAM) || []).slice(); if (extraLine) mine.push(extraLine);
    const my = totals(mine);
    const others = [...R.entries()].filter(([t]) => t !== MY_TEAM).map(([, ls]) => totals(ls));
    return { my, ranks: CATS.map((_, c) => rankOf(my, others, c)) };
  }
  // roto-style overall standing: sum each team's 9 category ranks (lower = better), then rank the 12 sums
  function overallRank() {
    const R = rosters();
    const teamTotals = new Map([...R.entries()].map(([t, ls]) => [t, totals(ls)]));
    const teams = [...teamTotals.keys()];
    const sums = teams.map(t => {
      const mine = teamTotals.get(t), others = teams.filter(x => x !== t).map(x => teamTotals.get(x));
      return [t, CATS.reduce((s, _, c) => s + rankOf(mine, others, c), 0)];
    }).sort((a, b) => a[1] - b[1]);
    let rank = 1;
    const byTeam = new Map(sums.map(([t, sum], i) => {
      if (i > 0 && sum !== sums[i - 1][1]) rank = i + 1;
      return [t, rank];
    }));
    return byTeam.get(MY_TEAM);
  }

  // ---------- 4. suggestions ----------
  const W = r => r <= 4 ? 0.5 : r <= 8 ? 1 : 0.25; // double down / target / punt
  function availablePlayers() {
    const taken = new Set([...S.picks.values()].map(v => v.pid).concat([...DOM_MINE]));
    return [...S.players.values()].filter(p => p.line && !taken.has(p.id));
  }
  // how adding this player would move each of your category ranks, vs. base (your current roster)
  function evaluate(p, base) {
    const a = analyze(p.line); let score = 0; const moves = [];
    CATS.forEach((c, i) => { const d = base.ranks[i] - a.ranks[i]; score += d * W(base.ranks[i]); if (d !== 0) moves.push([c, base.ranks[i], a.ranks[i], d]); });
    return { score, moves };
  }
  function suggestions(base) {
    const avail = availablePlayers().sort((a, b) => a.adp - b.adp);
    return avail.slice(0, 40).map(p => ({ p, ...evaluate(p, base) }))
      .sort((x, y) => S.mode === 'bpa' ? x.p.adp - y.p.adp : (y.score - x.score || x.p.adp - y.p.adp)).slice(0, 10);
  }
  const searchNorm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  function searchResults(base) {
    const q = searchNorm(S.query.trim()); if (!q) return [];
    return availablePlayers().filter(p => searchNorm(p.full + ' ' + p.name).includes(q))
      .sort((a, b) => a.adp - b.adp).slice(0, 15).map(p => ({ p, ...evaluate(p, base) }));
  }
  function myPickAfter(n) { // first of my picks with number > n
    if (!S.order.length) return null;
    for (let i = n; i < S.order.length; i++) if (S.order[i] === MY_TEAM) return i + 1;
    return null;
  }
  function myNextPick() {
    const cur = S.onClock ? S.onClock.pick : S.picks.size + 1;
    if (S.order.length) { for (let i = cur - 1; i < S.order.length; i++) if (S.order[i] === MY_TEAM) return i + 1; }
    return null;
  }

  // ---------- 5. overlay UI ----------
  const CSS = `
  #fh{position:fixed;right:16px;bottom:16px;width:497px;max-height:calc(100vh - 32px);overflow:auto;z-index:2147483000;
    background:#101418;color:#e9edf1;border:1px solid #2a323b;border-radius:12px;box-shadow:0 8px 28px rgba(0,0,0,.5);
    font:14px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-variant-numeric:tabular-nums}
  #fh *{box-sizing:border-box}
  #fh .hd{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;border-bottom:1px solid #2a323b;cursor:move;user-select:none}
  #fh .ttl{font-weight:700;font-size:15px;letter-spacing:.3px}#fh .ttl b{color:#e8a54c}
  #fh .sub{color:#9aa4af;font-size:13.5px}
  #fh button{font:inherit;font-size:13.5px;color:#e9edf1;background:#1b2128;border:1px solid #2f3842;border-radius:6px;padding:4px 10px;cursor:pointer}
  #fh button:focus-visible{outline:2px solid #e8a54c;outline-offset:1px}
  #fh button.ic{width:30px;height:30px;padding:0;display:grid;place-items:center;border-radius:8px}
  #fh .seg{display:flex}#fh .seg button{border-radius:0}#fh .seg button:first-child{border-radius:6px 0 0 6px}#fh .seg button:last-child{border-radius:0 6px 6px 0;border-left:none}
  #fh button.on{background:#e8a54c;color:#1b1207;border-color:#e8a54c;font-weight:600}
  #fh .bd{padding:10px 12px;display:flex;flex-direction:column;gap:12px}
  #fh .grid{margin-top:6px}#fh .row{display:grid;grid-template-columns:44px 1fr 70px;gap:8px;align-items:center;padding:5px 0;border-bottom:1px solid #2c333c}#fh .row:last-child{border-bottom:none}
  #fh .cn{font-weight:600}
  #fh .val{color:#b4bcc6}
  #fh .rk{text-align:center;font-weight:700;border-radius:5px;padding:2px 0}
  #fh .g{background:#14301d;color:#6fd184}#fh .o{background:#35240f;color:#f0a04b}#fh .r{background:#361714;color:#ee7a6c}
  #fh .gt{color:#6fd184}#fh .ot{color:#f0a04b}#fh .rt{color:#ee7a6c}
  #fh .sec{font-size:13.5px;text-transform:uppercase;letter-spacing:.06em;color:#9aa4af;display:flex;justify-content:space-between;align-items:center;gap:8px}
  #fh .legend{color:#9aa4af;font-size:13.5px;margin:6px 0 4px}
  #fh .strip{display:grid;grid-template-columns:38px repeat(9,1fr);gap:3px;align-items:stretch;margin-top:4px}
  #fh .strip.hdr span{text-align:center;font-size:13.5px;font-weight:700}
  #fh .cell,#fh .net{text-align:center;font-size:13.5px;font-weight:700;border-radius:4px;padding:3px 0;display:flex;flex-direction:column;justify-content:center;line-height:1.2}
  #fh .cell b{font-weight:600;color:#e9edf1}#fh .cell i{font-style:normal;font-weight:700}
  #fh .cell.nt{background:#161b21}#fh .cell.nt i{color:#4a535d}
  #fh .cell.up,#fh .net.up{background:#14301d;color:#6fd184}#fh .cell.dn,#fh .net.dn{background:#361714;color:#ee7a6c}
  #fh .net.nt{color:#9aa4af;background:#1b2128}
  #fh .up{color:#6fd184}#fh .dn{color:#ee7a6c}
  #fh .s{padding:8px 0;border-top:1px solid #222a32}
  #fh .top{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
  #fh .nm{font-weight:650;font-size:14.5px}#fh .meta{color:#9aa4af;font-size:13.5px}
  #fh .tag{font-size:13px;font-weight:600;border-radius:4px;padding:1px 6px;white-space:nowrap}
  #fh .q:focus-visible{outline:2px solid #e8a54c}
  #fh .strip.hdr .nh{color:#9aa4af;font-size:12px;font-weight:600}#fh .tag.fall{background:#10283a;color:#6cb8f0}
  #fh .tag.safe{background:#14301d;color:#6fd184}#fh .tag.flip{background:#35240f;color:#f0a04b}#fh .tag.gone{background:#361714;color:#ee7a6c}
  #fh .inj{background:#361714;color:#ee7a6c;border-radius:3px;padding:0 5px;font-size:13px;margin-left:6px}
  #fh.min{width:auto}#fh.min .bd{display:none}#fh.min .hd{border-bottom:none}
  #fh input[type=search]{width:100%;background:#161b21;border:1px solid #2f3842;border-radius:6px;color:#e9edf1;padding:6px 10px;font:inherit;font-size:13.5px;margin-top:6px}
  #fh input[type=search]::placeholder{color:#5c6672}
  #fh input[type=search]:focus-visible{outline:2px solid #e8a54c;outline-offset:1px}
  #fh .empty{color:#9aa4af;font-size:13.5px;padding:8px 0}
  #fh .upd{display:inline-block;margin-top:5px;color:#1b1207;background:#e8a54c;font-weight:700;font-size:12.5px;padding:2px 7px;border-radius:4px;text-decoration:none}
  #fh .upd:hover{filter:brightness(1.08)}`;
  let root, dirty = false;
  function schedule() { if (!dirty) { dirty = true; setTimeout(render, 150); } }
  function mount() {
    if (root || !document.body) return;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    root = document.createElement('div'); root.id = 'fh'; document.body.appendChild(root);
    root.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.mode) { S.mode = b.dataset.mode; render(); }
      if (b.dataset.act === 'min') { S.collapsed = !S.collapsed; render(); }
    });
    root.addEventListener('input', e => {
      if (e.target && e.target.id === 'fh-search') { S.query = e.target.value; render(); }
    });
    // drag
    let drag = null;
    root.addEventListener('mousedown', e => { if (!e.target.closest('.hd') || e.target.closest('button')) return; const r = root.getBoundingClientRect(); drag = { dx: e.clientX - r.left, dy: e.clientY - r.top }; e.preventDefault(); });
    window.addEventListener('mousemove', e => { if (!drag) return; root.style.left = Math.max(0, e.clientX - drag.dx) + 'px'; root.style.top = Math.max(0, e.clientY - drag.dy) + 'px'; root.style.right = 'auto'; root.style.bottom = 'auto'; });
    window.addEventListener('mouseup', () => { if (drag) { try { localStorage.setItem('fhPos', JSON.stringify({ l: root.style.left, t: root.style.top })); } catch (e) {} } drag = null; });
    try { const pos = JSON.parse(localStorage.getItem('fhPos') || 'null'); if (pos && pos.l) { root.style.left = pos.l; root.style.top = pos.t; root.style.right = 'auto'; root.style.bottom = 'auto'; } } catch (e) {}
    render();
  }
  const fmt = (c, v) => c < 2 ? v.toFixed(3).replace(/^0/, '') : Math.round(v).toLocaleString();
  const cls = r => r <= 4 ? 'g' : r <= 8 ? 'o' : 'r';
  const label = r => r <= 4 ? 'Double down' : r <= 8 ? 'Target' : 'Punt';
  const SHORT = ['FG', 'FT', '3P', 'PT', 'RB', 'AS', 'ST', 'BK', 'TO'];
  const ICON_MIN = '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const ICON_MAX = '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M4 10l4-4 4 4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const escHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function playerCard(p, moves, cur, next) {
    const byCat = {}; (moves || []).forEach(x => byCat[x[0]] = x);
    const net = (moves || []).reduce((s, x) => s + x[3], 0);
    const L = p.line;
    const vals = [L.fgp, L.ftp, L.tpm, L.pts, L.reb, L.ast, L.stl, L.blk, L.to]; // per game (projected season ÷ projected games)
    const fv = (i, v) => i < 2 ? v.toFixed(3).replace(/^0/, '') : v.toFixed(1);
    const cells = `<div class="strip">${'<span class="net ' + (net > 0 ? 'up' : net < 0 ? 'dn' : 'nt') + '">' + (net > 0 ? '+' : '') + net + '</span>'}${CATS.map((c, i) => {
      const x = byCat[c]; const d = x ? x[3] : 0;
      const title = `${c}: ${fv(i, vals[i])} per game${x ? ` · your rank #${x[1]} → #${x[2]}` : ' · no rank change'}`;
      return `<span class="cell ${d > 0 ? 'up' : d < 0 ? 'dn' : 'nt'}" title="${title}"><b>${fv(i, vals[i])}</b><i>${d > 0 ? '▲' + d : d < 0 ? '▼' + (-d) : '–'}</i></span>`;
    }).join('')}</div>`;
    // Will he still be there? Compare his ADP to the pick you'd wait for.
    const mineNow = S.onClock && S.onClock.team === MY_TEAM;
    const waitPick = mineNow ? myPickAfter(cur) : next;   // on the clock: your following pick; otherwise: your next pick
    let tag = '';
    if (p.adp < cur - 12) tag = `<span class="tag fall">Faller</span>`;
    else if (waitPick) {
      const gap = p.adp - waitPick;
      if (gap >= 6) tag = `<span class="tag safe">Likely there</span>`;
      else if (gap >= -6) tag = `<span class="tag flip">Maybe there</span>`;
      else tag = `<span class="tag gone">Likely gone</span>`;
    }
    return `<div class="s"><div class="top"><div><span class="nm">${p.name}</span>${p.inj ? `<span class="inj">${p.inj}</span>` : ''}<div class="meta">${p.pos} · ${p.team}${p.src === 'live' ? '' : p.src === 'saved' ? ' · saved proj' : ' · last season'} · ADP ${p.adp < 900 ? p.adp.toFixed(0) : '–'}</div></div>${tag}</div>${cells}</div>`;
  }
  function render() {
    dirty = false; if (!root) return;
    // an innerHTML rewrite drops focus/cursor, so save and restore them around it if the search box is active
    const active = root.contains(document.activeElement) ? document.activeElement : null;
    const searchFocused = active && active.id === 'fh-search';
    const selStart = searchFocused ? active.selectionStart : null, selEnd = searchFocused ? active.selectionEnd : null;

    root.classList.toggle('min', S.collapsed);
    const next = myNextPick();
    const cur = S.onClock ? S.onClock.pick : S.picks.size + 1;
    const status = `${S.picks.size ? S.picks.size + ' picks' : (DOM_MINE.size ? 'your roster only' : '0 picks')}${S.onClock ? ` · #${S.onClock.pick} on clock` : ''}${next ? ` · you #${next}` : ''}${S.ready ? '' : ' · ' + (S.err || 'loading…')}`;
    const updateBanner = S.newVersion ? `<a class="upd" href="${RAW_URL}" target="_blank" rel="noopener">v${escHtml(S.newVersion)} available — click to update</a>` : '';
    const head = `<div class="hd"><div><div class="ttl">Jason's <b>Cheat Sheet</b></div><div class="sub">${status}</div>${updateBanner}</div><button class="ic" data-act="min" title="${S.collapsed ? 'Expand' : 'Minimize'}" aria-label="${S.collapsed ? 'Expand' : 'Minimize'}">${S.collapsed ? ICON_MAX : ICON_MIN}</button></div>`;
    if (!S.ready || !AVG) { root.innerHTML = head; return; }
    const base = analyze();
    const grid = CATS.map((c, i) => `<div class="row"><span class="cn">${c}</span><span class="val">${fmt(i, base.my[i])}</span><span class="rk ${cls(base.ranks[i])}" >#${base.ranks[i]}</span></div>`).join('');
    const colHead = `<div class="strip hdr"><span class="nh" title="Net rank change across all 9 categories">Net</span>${SHORT.map((s, i) => `<span class="${cls(base.ranks[i])}t">${s}</span>`).join('')}</div>`;
    const sug = suggestions(base).map(({ p, moves }) => playerCard(p, moves, cur, next)).join('');
    const q = S.query.trim();
    const results = q ? searchResults(base) : [];
    const searchBody = !q ? '' : results.length
      ? colHead + results.map(({ p, moves }) => playerCard(p, moves, cur, next)).join('')
      : `<div class="empty">No available players match "${escHtml(q)}".</div>`;
    root.innerHTML = head + `<div class="bd">
      <div><div class="sec"><span>Category ranks</span><span>Overall #${overallRank()} of 12</span></div>
      <div class="grid">${grid}</div></div>
      <div><div class="sec"><span>Search players</span></div>
      <input id="fh-search" type="search" autocomplete="off" placeholder="Player name…" value="${escHtml(S.query)}">
      ${searchBody}</div>
      <div><div class="sec"><span>Next pick</span><span class="seg"><button data-mode="fit" class="${S.mode === 'fit' ? 'on' : ''}">Best fit</button><button data-mode="bpa" class="${S.mode === 'bpa' ? 'on' : ''}">Best available</button></span></div>
      ${colHead}${sug}</div></div>`;

    if (searchFocused) {
      const inp = root.querySelector('#fh-search');
      if (inp) { inp.focus(); try { inp.setSelectionRange(selStart, selEnd); } catch (e) {} }
    }
  }

  checkForUpdate();
  // wait for the draft room to finish its own login handshake before asking for player data
  setTimeout(() => loadPlayers(), 2500);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
  setInterval(() => { if (!root) mount(); }, 2000);
})();
