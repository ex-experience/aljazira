export class RaidDirector {
  constructor(){this.wave=0;this.cooldown=45}
  budget({days=1,baseValue=0,weapons=1,players=1}){return Math.round(4+days*1.2+baseValue*.01+weapons*.6+players*2)}
  update(dt,state,spawn){this.cooldown-=dt;if(this.cooldown>0)return;this.wave++;let b=this.budget(state);while(b>0){const cost=b>8?3:b>4?2:1;spawn(cost);b-=cost}this.cooldown=Math.max(22,58-this.wave*2)}
}