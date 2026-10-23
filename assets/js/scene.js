const canvas=document.querySelector('#house-scene');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
async function initHouse(){
 if (reduced.matches) return;
 let THREE;
 try { THREE = await import('../vendor/three.module.js'); } catch { return; }
 if (reduced.matches) return;
 let renderer;
 try{
 renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(100,80,false);
 const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(35,1.25,.1,100);camera.position.set(4,3.5,5.5);camera.lookAt(0,.4,0);
 const house=new THREE.Group();scene.add(house);
 const material=new THREE.LineBasicMaterial({color:0x8d713e,transparent:true,opacity:.9});
 const lines=[];const line=(a,b)=>{lines.push(...a,...b);};
 const corners=[[-1,0,-.7],[1,0,-.7],[1,0,.7],[-1,0,.7]];
 for(let i=0;i<4;i++){let a=corners[i],b=corners[(i+1)%4];line(a,b);line([a[0],1.2,a[2]],[b[0],1.2,b[2]]);line(a,[a[0],1.2,a[2]]);}
 line([-1,1.2,.7],[0,1.95,.7]);line([0,1.95,.7],[1,1.2,.7]);line([-1,1.2,-.7],[0,1.95,-.7]);line([0,1.95,-.7],[1,1.2,-.7]);line([0,1.95,-.7],[0,1.95,.7]);
 for(const x of [-.62,.43]){line([x,.45,.71],[x,.9,.71]);line([x,.9,.71],[x+.25,.9,.71]);line([x+.25,.9,.71],[x+.25,.45,.71]);line([x+.25,.45,.71],[x,.45,.71]);}
 line([-.18,0,.71],[-.18,.75,.71]);line([-.18,.75,.71],[.18,.75,.71]);line([.18,.75,.71],[.18,0,.71]);
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(lines,3));house.add(new THREE.LineSegments(geometry,material));house.rotation.y=-.12;
 const groundGeometry=new THREE.BufferGeometry().setFromPoints(Array.from({length:81},(_,i)=>new THREE.Vector3(Math.cos(i/80*Math.PI*2)*1.6,-.08,Math.sin(i/80*Math.PI*2)*1.3)));const ground=new THREE.Line(groundGeometry,material);house.add(ground);
 let visible=true,frame=0;const started=performance.now();
 const color=()=>{material.color.set(document.documentElement.dataset.theme==='dark'?0xd8b776:0x8d713e);renderer.render(scene,camera);};
 function render(t){frame=0;if(!visible||document.hidden||reduced.matches||t-started>=4000)return;house.rotation.y=-.12+Math.sin((t-started)*.0007)*.12;renderer.render(scene,camera);frame=requestAnimationFrame(render);}
 const start=()=>{cancelAnimationFrame(frame);frame=0;color();if(visible&&!document.hidden&&!reduced.matches&&performance.now()-started<4000)frame=requestAnimationFrame(render);};
 const observer=new IntersectionObserver(es=>{visible=es[0].isIntersecting;start();});observer.observe(canvas);document.addEventListener('visibilitychange',start);reduced.addEventListener('change',start);window.addEventListener('themechange',color);canvas.dataset.rendered='threejs';start();
 window.addEventListener('pagehide',event=>{if(event.persisted)return;cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('visibilitychange',start);reduced.removeEventListener('change',start);window.removeEventListener('themechange',color);geometry.dispose();groundGeometry.dispose();material.dispose();renderer.dispose();},{once:true});
 }catch(error){renderer?.dispose();canvas.hidden=true;}
}


// Load the decorative renderer only when visible and motion is welcome.
if(canvas && !reduced.matches){
 const lazy = new IntersectionObserver(entries => {
  if(entries.some(entry => entry.isIntersecting)) { lazy.disconnect(); initHouse(); }
 });
 lazy.observe(canvas.parentElement);
}
