export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export class Vec3 {
  constructor(x=0, y=0, z=0) { this.x=x; this.y=y; this.z=z; }
  set(x,y,z){ this.x=x; this.y=y; this.z=z; return this; }
  copy(){ return new Vec3(this.x,this.y,this.z); }
  add(v){ this.x+=v.x; this.y+=v.y; this.z+=v.z; return this; }
  sub(v){ this.x-=v.x; this.y-=v.y; this.z-=v.z; return this; }
  mul(s){ this.x*=s; this.y*=s; this.z*=s; return this; }
  len(){ return Math.hypot(this.x,this.y,this.z); }
  normalize(){
    const L = this.len() || 1;
    this.x/=L; this.y/=L; this.z/=L; return this;
  }
  static cross(a,b){
    return new Vec3(
      a.y*b.z - a.z*b.y,
      a.z*b.x - a.x*b.z,
      a.x*b.y - a.y*b.x
    );
  }
}

export class Mat4 {
  constructor() {
    this.m = new Float32Array(16);
    this.identity();
  }
  identity() {
    const m = this.m;
    m[0]=1; m[1]=0; m[2]=0; m[3]=0;
    m[4]=0; m[5]=1; m[6]=0; m[7]=0;
    m[8]=0; m[9]=0; m[10]=1; m[11]=0;
    m[12]=0; m[13]=0; m[14]=0; m[15]=1;
    return this;
  }
  copyFrom(b){
    this.m.set(b.m);
    return this;
  }
  multiply(b) {
    const a = this.m;
    const c = new Float32Array(16);
    const d = b.m;

    for (let r=0;r<4;r++){
      for (let col=0;col<4;col++){
        c[col + r*4] =
          a[0 + r*4]*d[col + 0*4] +
          a[1 + r*4]*d[col + 1*4] +
          a[2 + r*4]*d[col + 2*4] +
          a[3 + r*4]*d[col + 3*4];
      }
    }
    this.m = c;
    return this;
  }
  static mul(a,b){
    const out = new Mat4();
    out.copyFrom(a);
    out.multiply(b);
    return out;
  }

  translate(x,y,z){
    const t = new Mat4();
    t.m[12]=x; t.m[13]=y; t.m[14]=z;
    return this.multiply(t);
  }

  scale(x,y,z){
    const s = new Mat4();
    s.m[0]=x; s.m[5]=y; s.m[10]=z;
    return this.multiply(s);
  }

  rotateY(deg){
    const rad = deg * Math.PI/180;
    const c = Math.cos(rad), s = Math.sin(rad);
    const r = new Mat4();
    r.m[0]= c; r.m[2]= s;
    r.m[8]=-s; r.m[10]=c;
    return this.multiply(r);
  }

  perspective(fovDeg, aspect, near, far){
    const f = 1.0 / Math.tan((fovDeg*Math.PI/180)/2);
    const nf = 1 / (near - far);
    const m = this.m;

    m[0] = f/aspect; m[1]=0; m[2]=0;                m[3]=0;
    m[4] = 0;        m[5]=f; m[6]=0;                m[7]=0;
    m[8] = 0;        m[9]=0; m[10]=(far+near)*nf;   m[11]=-1;
    m[12]= 0;        m[13]=0; m[14]=(2*far*near)*nf; m[15]=0;
    return this;
  }

  lookAt(eye, at, up){
    const z = eye.copy().sub(at).normalize();     // forward
    const x = Vec3.cross(up, z).normalize();      // right
    const y = Vec3.cross(z, x).normalize();       // up corrected

    const m = this.m;
    m[0]=x.x; m[1]=y.x; m[2]=z.x; m[3]=0;
    m[4]=x.y; m[5]=y.y; m[6]=z.y; m[7]=0;
    m[8]=x.z; m[9]=y.z; m[10]=z.z; m[11]=0;
    m[12]=-(x.x*eye.x + x.y*eye.y + x.z*eye.z);
    m[13]=-(y.x*eye.x + y.y*eye.y + y.z*eye.z);
    m[14]=-(z.x*eye.x + z.y*eye.y + z.z*eye.z);
    m[15]=1;
    return this;
  }
}
