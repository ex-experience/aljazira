const CHUNK=16;
function hash(x,z,s){let n=Math.sin(x*127.1+z*311.7+s*74.7)*43758.5453;return n-Math.floor(n)}
function noise(x,z,s){let a=0,amp=.5,f=.055;for(let i=0;i<5;i++){a+=(hash(Math.floor(x*f),Math.floor(z*f),s)*2-1)*amp;f*=2;amp*=.5}return a}
onmessage=e=>{const {cx,cz,seed}=e.data;const heights=new Uint8Array(CHUNK*CHUNK),types=new Uint8Array(CHUNK*CHUNK);let i=0;
  for(let z=0;z<CHUNK;z++)for(let x=0;x<CHUNK;x++){const wx=cx*CHUNK+x,wz=cz*CHUNK+z,r=noise(wx,wz,seed),macro=noise(wx*.17,wz*.17,seed+99);let h=Math.max(2,Math.min(14,Math.floor(5+r*3+macro*4)));let moisture=hash(Math.floor(wx*.04),Math.floor(wz*.04),seed+17);let type=h<4?0:h>10?2:moisture>.62?3:1;heights[i]=h;types[i]=type;i++}
  postMessage({cx,cz,heights,types},[heights.buffer,types.buffer])
}