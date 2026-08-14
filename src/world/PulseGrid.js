export class PulseGrid {
  constructor(){this.nodes=new Map();this.dirty=true}
  add(id,type,inputs=[]){this.nodes.set(id,{id,type,inputs:[...inputs],power:false,state:false});this.dirty=true}
  remove(id){this.nodes.delete(id);for(const n of this.nodes.values())n.inputs=n.inputs.filter(x=>x!==id);this.dirty=true}
  connect(from,to){const n=this.nodes.get(to);if(n&&!n.inputs.includes(from)){n.inputs.push(from);this.dirty=true}}
  setSource(id,on){const n=this.nodes.get(id);if(n){n.state=!!on;this.dirty=true}}
  tick(){
    if(!this.dirty)return;for(let pass=0;pass<8;pass++)for(const n of this.nodes.values()){const ins=n.inputs.map(id=>this.nodes.get(id)?.power||false);let p=false;
      if(n.type==="CORE"||n.type==="SWITCH")p=!!n.state;
      else if(n.type==="AND")p=ins.length>0&&ins.every(Boolean);
      else if(n.type==="OR")p=ins.some(Boolean);
      else if(n.type==="NOT")p=!ins[0];
      else p=ins.some(Boolean);
      n.power=p}
    this.dirty=false
  }
  serialize(){return[...this.nodes.values()].map(n=>({...n}))}
  restore(arr=[]){this.nodes.clear();for(const n of arr)this.nodes.set(n.id,{...n,inputs:[...(n.inputs||[])]});this.dirty=true}
}