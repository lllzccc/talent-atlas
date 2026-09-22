import type {KeyboardCoordinateGetter} from '@dnd-kit/core';
// One arrow moves to the adjacent grid, independent of screen width or cell height.
export const gridKeyboardCoordinates:KeyboardCoordinateGetter=(event,{context,currentCoordinates})=>{
 const directions:Record<string,[number,number]>={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};const direction=directions[event.code];if(!direction)return;event.preventDefault();const rect=context.collisionRect;if(!rect)return;
 const cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;const candidates=[...context.droppableRects.entries()].map(([id,r])=>({id,r,x:r.left+r.width/2,y:r.top+r.height/2}));const current=context.over?candidates.find(c=>c.id===context.over?.id):undefined;const origin=current||{x:cx,y:cy};
 const next=candidates.filter(c=>direction[0]?Math.abs(c.y-origin.y)<30&&(c.x-origin.x)*direction[0]>20:Math.abs(c.x-origin.x)<30&&(c.y-origin.y)*direction[1]>20).sort((a,b)=>Math.hypot(a.x-origin.x,a.y-origin.y)-Math.hypot(b.x-origin.x,b.y-origin.y))[0];if(next)return {x:currentCoordinates.x+next.x-cx,y:currentCoordinates.y+next.y-cy};
};
