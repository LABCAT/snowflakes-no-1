// default.vert
attribute vec3 aPosition;
attribute vec2 aTexCoord;
varying vec2 vTexCoord;

void main() {
  vTexCoord = aTexCoord;
  vec3 position = aPosition;
  position.x = 2.0 * position.x - 1.0; // Transform x from [0,1] to [-1,1]
  position.y = 2.0 * position.y - 1.0; // Transform y from [0,1] to [-1,1]
  gl_Position = vec4(position, 1.0);
}
