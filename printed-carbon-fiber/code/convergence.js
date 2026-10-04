// Mesh convergence and first-damage check-region sensitivity for the technical note. Usage: node convergence.js
const path='./';
const { feaSolve } = require(path+'fea-solver.js');
const LBF=4.44822, L=101.6, b=12.7, P=30*LBF;
const PLA={E:2300,st:51,sc:78.1}, PPACF={E:11800,st:168,sc:168};
const AF=Math.PI/4*0.0576, COVER=10.5/12.7;
function setup(cf){const Vc=AF*0.6/(0.7*0.24),Eb=161000*Vc+PLA.E*(1-Vc),ExL=COVER*Eb+(1-COVER)*PLA.E;
 return {Vc,Eb,ExL,sbT:2100*Vc,sbC:cf*2100*Vc,mats:[{Ex:PLA.E,Ey:PLA.E,nxy:.35,G:PLA.E/2.7},{Ex:ExL,Ey:PLA.E*1.1,nxy:.3,G:PLA.E/2.6},{Ex:PPACF.E,Ey:PPACF.E,nxy:.35,G:PPACF.E/2.7}]}}
function plans(sub){const bot=[0,0];for(let k=0;k<3;k++)bot.push(1,1,0);const ny=52;
 const p={none:Array(ny).fill(0),both:bot.concat(Array(ny-2*bot.length).fill(0),bot.slice().reverse()),bottom:bot.concat(Array(ny-bot.length).fill(0)),ppacf:Array(ny).fill(2)};
 for(const k in p)p[k]=p[k].flatMap(v=>Array(sub).fill(v));return p}
function run(nx,sub,a0,a1,cf){const M=setup(cf),pl=plans(sub),ny=52*sub,dy=0.12/sub,dx=L/nx,out={};
 for(const [key,rows] of Object.entries(pl)){const r=feaSolve({L,nx,dy,rows,mats:M.mats,b,P,loadHalf:2.5});let um=0;
  for(let i=0;i<nx;i++){const x=(i+.5)*dx,a=Math.abs(x-L/2);if(a<a0||a>a1)continue;const k=(L/2)/(L/2-a);
   for(let j=0;j<ny;j++){const s=r.sx[i*ny+j];let u;if(rows[j]===1){const sb=s*M.Eb/M.ExL;u=sb>0?sb/M.sbT:-sb/M.sbC}else{const q=rows[j]===2?PPACF:PLA;u=s>0?s/q.st:-s/q.sc}um=Math.max(um,k*u)}}
  out[key]={sag:r.mid,F:P/um}}
 const b0=out.none;return `plain ${(b0.sag/25.4).toFixed(4)} in ${(b0.F/LBF).toFixed(1)} lbf | both ${(b0.sag/out.both.sag).toFixed(2)}x ${(out.both.F/b0.F).toFixed(2)}x | tension ${(b0.sag/out.bottom.sag).toFixed(2)}x ${(out.bottom.F/b0.F).toFixed(2)}x | PPA ${(b0.sag/out.ppacf.sag).toFixed(2)}x ${(out.ppacf.F/b0.F).toFixed(2)}x`}
console.log('MESH (check 6-15 mm, compression 33%)');
for(const [nx,sub] of [[60,1],[120,1],[240,1],[120,2],[240,2]]) console.log(`nx ${nx}, ny ${52*sub}: `+run(nx,sub,6,15,.33));
console.log('CHECK REGION (nx 120, ny 52)');
for(const [a0,a1] of [[4,15],[6,10],[6,15],[6,25],[8,20],[10,20]]) console.log(`a ${a0}-${a1} mm: `+run(120,1,a0,a1,.33));
