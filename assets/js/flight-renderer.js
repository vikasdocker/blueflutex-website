/* Thousands of image billboards in one instanced WebGL draw. Own assets only. */
(() => {
  "use strict";
  const M = window.BlueFluteFlightMath;
  const load = src => new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
  const vertex = `#version 300 es
    precision highp float;
    in vec2 a_corner;
    in vec3 a_home;
    in vec3 a_field;
    in vec4 a_uv;
    in vec2 a_size;
    uniform vec3 u_camera;
    uniform vec2 u_projection;
    uniform vec2 u_origin;
    uniform vec2 u_pointer;
    uniform float u_blend;
    uniform float u_time;
    out vec2 v_uv;
    out vec2 v_local;
    out float v_alpha;
    void main() {
      float yaw = sin(u_time * .12) * .16 + u_pointer.x * .24;
      vec3 home = a_home;
      home.xz = mat2(cos(yaw),-sin(yaw),sin(yaw),cos(yaw)) * vec2(home.x,home.z-1300.);
      home.z += 1300.;
      home.y += sin(u_time*.16 + a_home.x*.003) * 7.;
      vec3 world = mix(home,a_field,u_blend);
      vec3 relative = world - u_camera;
      float depth = relative.z;
      float size = mix(a_size.x,a_size.y,u_blend);
      vec2 local = relative.xy + a_corner * vec2(size,size*.75);
      float farPlane = 16000.;
      float nearPlane = 25.;
      gl_Position = vec4(local*u_projection + u_origin*depth,
        ((farPlane+nearPlane)/(farPlane-nearPlane))*depth - (2.*farPlane*nearPlane)/(farPlane-nearPlane),depth);
      v_uv = a_uv.xy + (a_corner+.5)*a_uv.zw;
      v_local = a_corner+.5;
      v_alpha = smoothstep(45.,180.,depth) * (1.-smoothstep(11500.,15500.,depth));
    }`;
  const fragment = `#version 300 es
    precision highp float;
    uniform sampler2D u_atlas;
    uniform float u_blend;
    in vec2 v_uv;
    in vec2 v_local;
    in float v_alpha;
    out vec4 color;
    void main() {
      vec2 edge = max(abs(v_local-.5)-.46,vec2(0.));
      if(length(edge)>.04) discard;
      vec3 rgb = texture(u_atlas,v_uv).rgb;
      vec3 homeColor = pow(max(rgb,vec3(.01)),vec3(.55))*.98 + .08;
      color = vec4(mix(homeColor,rgb,u_blend),v_alpha*.93);
    }`;

  function buildParticles(mask, count, span) {
    let seed = 92837;
    const random = () => { seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646; };
    const samples = [];
    const pixels = mask.getContext("2d").getImageData(0,0,mask.width,mask.height).data;
    for (let y=12;y<mask.height-12;y+=3) {
      for(let x=12;x<mask.width-12;x+=3) {
        if(pixels[(y*mask.width+x)*4+3]>80) samples.push([x-mask.width/2,mask.height/2-y]);
      }
    }
    const data = new Float32Array(count*12);
    for(let i=0;i<count;i++) {
      const point = samples.length ? samples[Math.floor(random()*samples.length)] : [Math.cos(i)*100,Math.sin(i)*200];
      const dust = i>count*.86;
      const homeX = dust ? (random()-.5)*2400 : point[0]*1.65+(random()-.5)*2;
      const homeY = dust ? (random()-.5)*1700 : point[1]*1.65+(random()-.5)*2;
      const homeZ = dust ? 1300+random()*3000 : 1300+(random()-.5)*170;
      const z = 250+random()*span;
      const t = z/M.spacing;
      const curve = M.path(t);
      const angle = random()*Math.PI*2;
      const radius = 180+Math.sqrt(random())*1600;
      const tile = i%8, col=tile%4, row=Math.floor(tile/4);
      data.set([homeX,homeY,homeZ,
        curve.x+Math.cos(angle)*radius,curve.y+Math.sin(angle)*radius*.78,z,
        (col*256+3)/1024,(row*192+3)/384,250/1024,186/384,
        dust ? 1.5+random()*2 : 3.4+random()*1.7,12+random()*43],i*12);
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
    [["a_home",3,0],["a_field",3,3],["a_uv",4,6],["a_size",2,10]].forEach(([name,size,offset])=>{
      loc=gl.getAttribLocation(program,name); gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc,size,gl.FLOAT,false,48,offset*4); gl.vertexAttribDivisor(loc,1);
    });
    const texture=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,atlas);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE); gl.generateMipmap(gl.TEXTURE_2D);
    const uniforms=Object.fromEntries(["camera","projection","origin","pointer","blend","time"].map(name=>[name,gl.getUniformLocation(program,"u_"+name)]));
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
        gl.uniform2f(uniforms.origin,.04*(1-state.blend),.16-.08*state.blend);
        gl.uniform2f(uniforms.pointer,state.pointerX,state.pointerY);
        gl.uniform1f(uniforms.blend,state.blend);gl.uniform1f(uniforms.time,state.time);
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
        const yaw=Math.sin(state.time*.12)*.16+state.pointerX*.24;
        for(let i=0;i<count;i+=2) {
          const o=i*12, homeX=data[o]*Math.cos(yaw)-(data[o+2]-1300)*Math.sin(yaw);
          const homeZ=data[o]*Math.sin(yaw)+(data[o+2]-1300)*Math.cos(yaw)+1300;
          const point={x:homeX+(data[o+3]-homeX)*state.blend,y:data[o+1]+(data[o+4]-data[o+1])*state.blend,z:homeZ+(data[o+5]-homeZ)*state.blend};
          const p=M.project(point,state.camera,state.width,state.height,state.blend);
          if(p.depth<60||p.depth>15000) continue;
          const size=(data[o+10]+(data[o+11]-data[o+10])*state.blend)*p.scale;
          if(p.x+size<0||p.x-size>state.width||p.y+size<0||p.y-size>state.height) continue;
          ctx.globalAlpha=M.clamp((p.depth-60)/150)*.9;
          const tile=(i/2)%8;ctx.drawImage(atlas,(tile%4)*256,Math.floor(tile/4)*192,256,192,p.x-size/2,p.y-size*.375,size,size*.75);
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
      const mask=document.createElement("canvas");mask.width=384;mask.height=384;
      const mark=await load("assets/img/blueflutex-mark-light.svg");
      if(mark) mask.getContext("2d").drawImage(mark,12,12,360,360);
      const count=matchMedia("(max-width:600px)").matches?1900:3200;
      const data=buildParticles(mask,count,8*M.spacing+6000);
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
