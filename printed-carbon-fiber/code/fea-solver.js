// FEA solver used in "How strong is 3D printed continuous carbon fiber?" (Sunnyday Technologies Technical Note, v1.2).
// 2D plane-stress, four-node quadrilateral elements (2x2 Gauss), layered orthotropic bar in three-point bending.
// Units: mm, N, MPa. Banded Cholesky (LDL^T) solver. Returns nodal displacements u, element-centre sigma_x and midspan deflection.
// Inputs: {L, nx, dy, rows (material index per element row, bottom to top), mats [{Ex,Ey,nxy,G}], b (width), P (load, N), loadHalf (mm)}.
// License: CC BY 4.0, Sunnyday Technologies.
function feaSolve(o){
  // 2D plane-stress Q4, layered bar, 3-point bend. Units mm, N, MPa.
  var L=o.L,nx=o.nx,dy=o.dy,rows=o.rows,mats=o.mats,b=o.b,P=o.P,lh=o.loadHalf;
  var ny=rows.length,dx=L/nx,N=2*(nx+1)*(ny+1),bw=2*(ny+1)+3,W=bw+1;
  function id(i,j){return i*(ny+1)+j}
  function q4(m){
    var f=1/(1-m.nxy*m.nxy*m.Ey/m.Ex),D=[[m.Ex*f,m.nxy*m.Ey*f,0],[m.nxy*m.Ey*f,m.Ey*f,0],[0,0,m.G]];
    var K=new Float64Array(64),g=1/Math.sqrt(3),xi=[-1,1,1,-1],et=[-1,-1,1,1],gp=[-g,g];
    for(var ai=0;ai<2;ai++)for(var bi=0;bi<2;bi++){var a=gp[ai],c=gp[bi];
      var B=[new Float64Array(8),new Float64Array(8),new Float64Array(8)];
      for(var n=0;n<4;n++){var dNx=xi[n]*(1+et[n]*c)/2/dx,dNy=et[n]*(1+xi[n]*a)/2/dy;B[0][2*n]=dNx;B[1][2*n+1]=dNy;B[2][2*n]=dNy;B[2][2*n+1]=dNx}
      var w=dx*dy/4*b;
      for(var i=0;i<8;i++)for(var j=0;j<8;j++){var s=0;for(var p=0;p<3;p++)for(var q=0;q<3;q++)s+=B[p][i]*D[p][q]*B[q][j];K[i*8+j]+=s*w}}
    return {K:K,D:D};
  }
  var el=mats.map(q4),A=new Float64Array(N*W),i,j,p,q;
  for(i=0;i<nx;i++)for(j=0;j<ny;j++){var e=el[rows[j]],nd=[id(i,j),id(i+1,j),id(i+1,j+1),id(i,j+1)],dof=[];
    for(p=0;p<4;p++)dof.push(2*nd[p],2*nd[p]+1);
    for(p=0;p<8;p++)for(q=0;q<8;q++){var r=dof[p],cc=dof[q];if(cc>=r)A[r*W+cc-r]+=e.K[p*8+q]}}
  var F=new Float64Array(N),top=[];
  for(i=0;i<=nx;i++)if(Math.abs(i*dx-L/2)<=lh+1e-9)top.push(i);
  top.forEach(function(k){F[2*id(k,ny)+1]-=P/top.length});
  [2*id(0,0),2*id(0,0)+1,2*id(nx,0)+1].forEach(function(d){A[d*W]+=1e12});
  for(var r0=0;r0<N;r0++){var dr=A[r0*W];
    for(var k=1;k<=bw&&r0+k<N;k++){var av=A[r0*W+k];if(av===0)continue;var fc=av/dr;
      for(var l=k;l<=bw&&r0+l<N;l++){var v=A[r0*W+l];if(v!==0)A[(r0+k)*W+l-k]-=fc*v}
      F[r0+k]-=fc*F[r0]}}
  var u=new Float64Array(N);
  for(r0=N-1;r0>=0;r0--){var s=F[r0];for(k=1;k<=bw&&r0+k<N;k++)s-=A[r0*W+k]*u[r0+k];u[r0]=s/A[r0*W]}
  var sx=new Float64Array(nx*ny);
  for(i=0;i<nx;i++)for(j=0;j<ny;j++){var D=el[rows[j]].D,n4=[id(i,j),id(i+1,j),id(i+1,j+1),id(i,j+1)];
    var ux=n4.map(function(t){return u[2*t]}),uy=n4.map(function(t){return u[2*t+1]});
    var ex=((ux[1]-ux[0])+(ux[2]-ux[3]))/(2*dx),ey=((uy[3]-uy[0])+(uy[2]-uy[1]))/(2*dy);
    sx[i*ny+j]=D[0][0]*ex+D[0][1]*ey}
  return {u:u,sx:sx,mid:-u[2*id(nx/2,0)+1]};
}

if (typeof module !== "undefined") module.exports = { feaSolve };
