const {onCall,HttpsError}=require("firebase-functions/v2/https");
const {initializeApp}=require("firebase-admin/app");
const {getFirestore,FieldValue}=require("firebase-admin/firestore");
initializeApp();const db=getFirestore();
const bad=["kill yourself","racial_slur_placeholder"];
function clean(s){return String(s||"").replace(/[<>]/g,"").trim().slice(0,180)}
exports.sendGlobalChat=onCall({enforceAppCheck:true},async req=>{
 if(!req.auth)throw new HttpsError("unauthenticated","Sign in required");
 const text=clean(req.data?.text);if(text.length<1)throw new HttpsError("invalid-argument","Empty message");
 if(bad.some(x=>text.toLowerCase().includes(x)))throw new HttpsError("invalid-argument","Message rejected");
 const uid=req.auth.uid,ref=db.collection("ChatRate").doc(uid),now=Date.now();
 await db.runTransaction(async tx=>{let s=await tx.get(ref),last=s.exists?(s.data().last||0):0;if(now-last<1800)throw new HttpsError("resource-exhausted","Slow down");tx.set(ref,{last:now},{merge:true})});
 await db.collection("GlobalChat").add({Uid:uid,PlayerTag:`EX-${uid.slice(-6).toUpperCase()}`,Text:text,CreatedAt:FieldValue.serverTimestamp()});
 return {ok:true}
});