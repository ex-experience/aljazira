export class SaveStore {
  constructor(name="EX_ALJAZIRA_DB"){this.name=name;this.db=null}
  async open(){if(this.db)return this.db;this.db=await new Promise((res,rej)=>{const r=indexedDB.open(this.name,1);r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains("worlds"))d.createObjectStore("worlds",{keyPath:"id"})};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});return this.db}
  async put(value){const d=await this.open();return new Promise((res,rej)=>{const tx=d.transaction("worlds","readwrite");tx.objectStore("worlds").put(value);tx.oncomplete=res;tx.onerror=()=>rej(tx.error)})}
  async get(id){const d=await this.open();return new Promise((res,rej)=>{const r=d.transaction("worlds","readonly").objectStore("worlds").get(id);r.onsuccess=()=>res(r.result||null);r.onerror=()=>rej(r.error)})}
  async del(id){const d=await this.open();return new Promise((res,rej)=>{const tx=d.transaction("worlds","readwrite");tx.objectStore("worlds").delete(id);tx.oncomplete=res;tx.onerror=()=>rej(tx.error)})}
}