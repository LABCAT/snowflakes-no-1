#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 uResolution;
uniform float uTime;

void main() {
    // Normalize coordinates (0 to 1)
    vec2 st = gl_FragCoord.xy / uResolution.xy;
    
    /// A very dark blue color (no red, no green, low blue)
    vec3 colorTop = vec3(0.0, 0.0, 0.2);

    // Animate blue intensity over time using sine wave
    float blue = 0.2 + 0.2 * sin(uTime);
    // Animate green channel with a phase shift
    float green = 0.2 + 0.2 * sin(uTime + 1.57); // 1.57 ≈ π/2 for offset
    // Animate red channel, offset further with 3.14 (π) for opposite phase
    float red = 0.2 + 0.2 * sin(uTime + 3.14); // π for reverse phase
    vec3 colorBottom = vec3(red, green, blue);
    
    // Linearly interpolate from bottom to top colors based on vertical position
    vec3 color = mix(colorBottom, colorTop, st.y);
    
    gl_FragColor = vec4(color, 1.0);
}