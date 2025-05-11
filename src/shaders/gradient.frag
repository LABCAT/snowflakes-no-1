#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    vec3 color = mix(vec3(0.05, 0.05, 0.1), vec3(0.0, 0.3, 0.6), st.y);
    gl_FragColor = vec4(color, 1.0);
}
