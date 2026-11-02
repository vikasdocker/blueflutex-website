/* Instanced thumbnail field with the portrait layout requested by the user. */
(() => {
  "use strict";
  const M = window.BlueFluteFlightMath;
  const load = src => new Promise(resolve => {
    const img = new Image();
    const timer=setTimeout(()=>resolve(null),5000);
    img.onload = () => {clearTimeout(timer);resolve(img);};
    img.onerror = () => {clearTimeout(timer);resolve(null);};
    img.src = src;
  });
  const vertex = `#version 300 es
    precision highp float;
    in vec2 a_corner;
    in vec3 a_home;
    in vec3 a_field;
    in vec4 a_uv;
    in vec2 a_size;
    in float a_tone;
    in vec3 a_portraitColor;
    uniform vec3 u_camera;
    uniform vec2 u_projection;
    uniform vec2 u_origin;
    uniform vec2 u_pointer;
    uniform float u_blend;
    uniform float u_time;
    uniform float u_assembly;
    uniform float u_homeScale;
    uniform float u_baseYaw;
    out vec2 v_uv;
    out vec2 v_local;
    out float v_alpha;
    out float v_tone;
    out vec3 v_portraitColor;
    void main() {
      float seed = fract(sin(dot(a_home.xy,vec2(12.9898,78.233)))*43758.5453);
      float assembled = smoothstep(seed*.12,.7+seed*.15,u_assembly);
      vec3 loose = vec3(a_home.x*1.3+cos(seed*6.283)*900.,a_home.y*1.2+sin(seed*6.283)*650.,a_home.z+900.+seed*1500.);
      vec3 home = mix(loose,a_home,assembled);
      home.xy *= u_homeScale;
      float yaw = u_baseYaw + sin(u_time * .1) * .045 + u_pointer.x * .1;
      home.xz = mat2(cos(yaw),-sin(yaw),sin(yaw),cos(yaw)) * vec2(home.x,home.z-1300.);
      home.z += 1300.;
      home.y += sin(u_time*.16 + a_home.x*.003) * 2.;
      vec3 world = mix(home,a_field,u_blend);
      vec3 relative = world - u_camera;
      float depth = relative.z;
      float size = mix(a_size.x*u_homeScale,a_size.y,u_blend);
      vec2 local = relative.xy + a_corner * vec2(size,size*.75);
      float farPlane = 16000.;
      float nearPlane = 25.;
      gl_Position = vec4(local*u_projection + u_origin*depth,
        ((farPlane+nearPlane)/(farPlane-nearPlane))*depth - (2.*farPlane*nearPlane)/(farPlane-nearPlane),depth);
      v_uv = a_uv.xy + (a_corner+.5)*a_uv.zw;
      v_local = a_corner+.5;
      v_alpha = smoothstep(45.,180.,depth) * (1.-smoothstep(11500.,15500.,depth)) * mix(.4+.6*u_assembly,1.,u_blend);
      v_tone = a_tone;
      v_portraitColor = a_portraitColor;
    }`;
  const fragment = `#version 300 es
    precision highp float;
    uniform sampler2D u_atlas;
    uniform float u_blend;
    in vec2 v_uv;
    in vec2 v_local;
    in float v_alpha;
    in float v_tone;
    in vec3 v_portraitColor;
    out vec4 color;
    void main() {
      vec2 edge = max(abs(v_local-.5)-.46,vec2(0.));
      if(length(edge)>.04) discard;
      vec3 rgb = texture(u_atlas,v_uv).rgb;
      vec3 homeColor = (.45+pow(max(rgb,vec3(.005)),vec3(.45))*.55) * pow(v_portraitColor,vec3(.65)) * (1.1+.15*v_tone);
      color = vec4(mix(homeColor,rgb,u_blend),v_alpha*.93);
    }`;

  function buildParticles(portrait, stride, dustCount, span) {
    let seed = 92837;
    const random = () => { seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646; };
    const pointStride=portrait.stride||4,sourceCount=portrait.points.length/pointStride;
    const bodyCount=Math.ceil(sourceCount/stride),count=bodyCount+dustCount;
    const data = new Float32Array(count*16);
    for(let i=0;i<count;i++) {
      const p=(i*stride%sourceCount)*pointStride,dust=i>=bodyCount;
      const tone=dust?.4+random()*.6:portrait.points[p+2];
      const color=!dust&&pointStride>=7?[portrait.points[p+4],portrait.points[p+5],portrait.points[p+6]]:[1,1,1];
      const homeX=dust?(random()-.5)*2800:(portrait.points[p]-(portrait.cols-1)/2)*portrait.cell[0]*11.607;
      const homeY=dust?(random()-.5)*2000:((portrait.rows-1)/2-portrait.points[p+1])*portrait.cell[1]*11.607;
      const homeZ=dust?1500+random()*3000:1300+(1-tone)*25;
      const z = 250+random()*span;
      const t = z/M.spacing;
      const curve = M.path(t);
      const angle = random()*Math.PI*2;
      const radius = 180+Math.sqrt(random())*1600;
      const tile = i%8, col=tile%4, row=Math.floor(tile/4);
      data.set([homeX,homeY,homeZ,
        curve.x+Math.cos(angle)*radius,curve.y+Math.sin(angle)*radius*.78,z,
        (col*256+3)/1024,(row*192+3)/384,250/1024,186/384,
        dust?1.5+random()*2:portrait.cell[0]*11.607*(.08+portrait.points[p+3]*.6)*(.3+tone*.7),12+random()*43,tone,...color],i*16);
    }
    return data;
  }
  function shader(gl,type,source) {
    const result = gl.createShader(type);
    gl.shaderSource(result,source); gl.compileShader(result);
    if(!gl.getShaderParameter(result,gl.COMPILE_STATUS)) { gl.deleteShader(result); throw new Error("Field shader unavailable"); }
    return result;
  }
  function gpu(canvas, atlas, data, count) {
    const gl = canvas.getContext("webgl2",{alpha:true,antialias:false,powerPreference:"low-power",premultipliedAlpha:false});
    if(!gl) return null;
    const program=gl.createProgram();
    const vs=shader(gl,gl.VERTEX_SHADER,vertex), fs=shader(gl,gl.FRAGMENT_SHADER,fragment);
    gl.attachShader(program,vs); gl.attachShader(program,fs); gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error("Field program unavailable");
    gl.useProgram(program);
    const quad=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,quad);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-.5,-.5,.5,-.5,-.5,.5,-.5,.5,.5,-.5,.5,.5]),gl.STATIC_DRAW);
    let loc=gl.getAttribLocation(program,"a_corner");
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    const instances=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,instances); gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
    [["a_home",3,0],["a_field",3,3],["a_uv",4,6],["a_size",2,10],["a_tone",1,12],["a_portraitColor",3,13]].forEach(([name,size,offset])=>{
      loc=gl.getAttribLocation(program,name); gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc,size,gl.FLOAT,false,64,offset*4); gl.vertexAttribDivisor(loc,1);
    });
    const texture=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,atlas);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE); gl.generateMipmap(gl.TEXTURE_2D);
    const uniforms=Object.fromEntries(["camera","projection","origin","pointer","blend","time","assembly","homeScale"].map(name=>[name,gl.getUniformLocation(program,"u_"+name)]));
    gl.uniform1f(gl.getUniformLocation(program,"u_baseYaw"),window.BlueFlutePortrait.yaw??.58);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0,0,0,0);
    const lost=event=>{event.preventDefault();canvas.dispatchEvent(new Event("field-unavailable"));};
    canvas.addEventListener("webglcontextlost",lost);
    return {
      type:"webgl2", canvas,
      resize(width,height,dpr) { canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr); gl.viewport(0,0,canvas.width,canvas.height); },
      draw(state) {
        if(gl.isContextLost()) return;
        const focal=Math.min(state.width,state.height)*1.12;
        gl.uniform3f(uniforms.camera,state.camera.x,state.camera.y,state.camera.z);
        gl.uniform2f(uniforms.projection,2*focal/state.width,2*focal/state.height);
        gl.uniform2f(uniforms.origin,.04*(1-state.blend),(1-2*state.homeY)*(1-state.blend)+.08*state.blend);
        gl.uniform2f(uniforms.pointer,state.pointerX,state.pointerY);
        gl.uniform1f(uniforms.blend,state.blend);gl.uniform1f(uniforms.time,state.time);
        gl.uniform1f(uniforms.assembly,state.assembly);gl.uniform1f(uniforms.homeScale,state.homeScale);
        gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArraysInstanced(gl.TRIANGLES,0,6,count);
      },
      destroy() { canvas.removeEventListener("webglcontextlost",lost);gl.deleteBuffer(quad);gl.deleteBuffer(instances);gl.deleteTexture(texture);gl.deleteProgram(program);gl.deleteShader(vs);gl.deleteShader(fs); },
    };
  }
  function fallback(canvas,atlas,data,count) {
    const ctx=canvas.getContext("2d");
    if(!ctx) return {type:"static",canvas,resize(){},draw(){},destroy(){}};
    let dpr=1;
    return {
      type:"canvas2d",canvas,
      resize(width,height,ratio) {dpr=ratio;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);},
      draw(state) {
        ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,state.width,state.height);
        const yaw=(window.BlueFlutePortrait.yaw??.58)+Math.sin(state.time*.1)*.045+state.pointerX*.1,step=Math.ceil(count/1700);
        for(let i=0;i<count;i+=step) {
          const o=i*16,raw=Math.sin(data[o]*12.9898+data[o+1]*78.233)*43758.5453,seed=raw-Math.floor(raw);
          const t=M.ease((state.assembly-seed*.12)/(.7+seed*.03));
          const looseX=data[o]*1.3+Math.cos(seed*6.283)*900,looseY=data[o+1]*1.2+Math.sin(seed*6.283)*650,looseZ=data[o+2]+900+seed*1500;
          const hx=(looseX+(data[o]-looseX)*t)*state.homeScale,hy=(looseY+(data[o+1]-looseY)*t)*state.homeScale,hz=looseZ+(data[o+2]-looseZ)*t;
          const homeX=hx*Math.cos(yaw)+(hz-1300)*Math.sin(yaw),homeZ=-hx*Math.sin(yaw)+(hz-1300)*Math.cos(yaw)+1300;
          const point={x:homeX+(data[o+3]-homeX)*state.blend,y:hy+(data[o+4]-hy)*state.blend,z:homeZ+(data[o+5]-homeZ)*state.blend};
          const p=M.project(point,state.camera,state.width,state.height,state.blend,state.homeY);
          if(p.depth<60||p.depth>15000) continue;
          const size=(data[o+10]*state.homeScale+(data[o+11]-data[o+10]*state.homeScale)*state.blend)*p.scale;
          if(p.x+size<0||p.x-size>state.width||p.y+size<0||p.y-size>state.height) continue;
          const alpha=M.clamp((p.depth-60)/150)*.9*((1-state.blend)*(.4+.6*state.assembly)+state.blend);
          if(state.blend<1){
            ctx.globalAlpha=alpha*(1-state.blend);
            const color=[data[o+13],data[o+14],data[o+15]].map(v=>Math.round(Math.min(1,Math.pow(v,.65)*1.12)*255));
            ctx.fillStyle=`rgb(${color.join(',')})`;ctx.fillRect(p.x-size/2,p.y-size*.375,size,size*.75);
          }
          if(state.blend>0){
            ctx.globalAlpha=alpha*state.blend;
            const tile=Math.floor(i/step)%8;ctx.drawImage(atlas,(tile%4)*256,Math.floor(tile/4)*192,256,192,p.x-size/2,p.y-size*.375,size,size*.75);
          }
        }
        ctx.globalAlpha=1;
      },destroy(){ctx.clearRect(0,0,canvas.width,canvas.height);},
    };
  }
  window.BlueFluteField = {
    async create(canvas, sources, options={}) {
      const images=await Promise.all(sources.map(load));
      const atlas=document.createElement("canvas");atlas.width=1024;atlas.height=384;
      const ctx=atlas.getContext("2d");ctx.fillStyle="#111414";ctx.fillRect(0,0,1024,384);
      images.forEach((img,i)=>{
        const x=(i%4)*256,y=Math.floor(i/4)*192;
        if(!img) {ctx.fillStyle=["#7cae9c","#c8c7b9","#818dc9"][i%3];ctx.fillRect(x+3,y+3,250,186);return;}
        const scale=Math.max(250/img.naturalWidth,186/img.naturalHeight);
        ctx.save();ctx.beginPath();ctx.rect(x+3,y+3,250,186);ctx.clip();
        ctx.drawImage(img,x+128-img.naturalWidth*scale/2,y+96-img.naturalHeight*scale/2,img.naturalWidth*scale,img.naturalHeight*scale);ctx.restore();
      });
      const mobile=matchMedia("(max-width:600px)").matches;
      const data=buildParticles(window.BlueFlutePortrait,mobile?2:1,mobile?350:700,8*M.spacing+6000),count=data.length/16;
      let renderer;
      try { renderer=options.force2d?null:gpu(canvas,atlas,data,count); } catch { renderer=null; }
      if(!renderer) {
        const replacement=document.createElement("canvas");replacement.id=canvas.id;replacement.className=canvas.className;
        canvas.replaceWith(replacement);canvas=replacement;
        renderer=fallback(canvas,atlas,data,count);
      }
      return renderer;
    },
  };
})();
