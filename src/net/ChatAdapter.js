export class ChatAdapter {
  constructor(){this.backend=null;this.listeners=new Set();this.local=[]}
  onMessage(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn)}
  emit(msg){this.local.push(msg);for(const fn of this.listeners)fn(msg)}
  async send(text){const clean=String(text||"").replace(/[<>]/g,"").trim().slice(0,180);if(!clean)return;if(this.backend)return this.backend.send(clean);this.emit({player:"YOU",text:clean,at:Date.now()})}
}