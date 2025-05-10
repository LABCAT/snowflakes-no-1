precision mediump float;
#define PI 3.14159265359

uniform float u_ratio;
uniform float u_moving;
uniform float u_stop_time;
uniform float u_speed;
uniform vec2 u_stop_randomizer;
uniform float u_clean;
uniform vec2 u_point;
uniform sampler2D u_texture;

varying vec2 vUv;

float rand(vec2 n) {
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

float noise(vec2 n) {
    const vec2 d = vec2(0., 1.);
    vec2 b = floor(n), f = smoothstep(vec2(0.), vec2(1.), fract(n));
    return mix(mix(rand(b), rand(b + d.yx), f.x),
               mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);
}

float get_stem_shape(vec2 _p, vec2 _uv, float _w, float _angle) {
    float x_offset = _p.y * sin(_angle);
    x_offset *= pow(3. * _uv.y, 2.);
    _p.x -= x_offset;

    float noise_power = .5;
    float cursor_horizontal_noise = noise_power * snoise(2. * _uv * u_stop_randomizer[0]);
    cursor_horizontal_noise *= pow(dot(_p.y, _p.y), .6);
    cursor_horizontal_noise *= pow(dot(_uv.y, _uv.y), .3);
    _p.x += cursor_horizontal_noise;

    float left = smoothstep(-_w, 0., _p.x);
    float right = 1. - smoothstep(0., _w, _p.x);
    float stem_shape = left * right;

    float grow_time = 1. - smoothstep(0., .2, u_stop_time);
    float stem_top_mask = smoothstep(0., pow(grow_time, .5), .03 - _p.y);
    stem_shape *= stem_top_mask;

    stem_shape *= (1. - step(.17, u_stop_time));
    return stem_shape;
}

float flower_shape(vec2 _point, float _size, float _outline, float _tickniess, float _noise, float _angle_offset) {
    float random_by_uv = noise(vUv);
    float petals_thickness = .5;
    float petals_number = 5. + floor(u_stop_randomizer[0] * 4.);
    float angle_animated_offset = .7 * (random_by_uv - .5) / (1. + 30. * u_stop_time);
    float flower_angle = atan(_point.y, _point.x) - angle_animated_offset;
    float flower_sectoral_shape = abs(sin(flower_angle * .5 * petals_number + _angle_offset)) + _tickniess * petals_thickness;

    vec2 flower_size_range = vec2(2., 18.);
    float flower_radial_shape = length(_point) * (flower_size_range[0] + flower_size_range[1] * u_stop_randomizer[0]);
    float radius_noise = sin(flower_angle * 13. + 15. * random_by_uv);
    flower_radial_shape += _noise * radius_noise;

    float flower_shape = 1. - smoothstep(0., _size * flower_sectoral_shape, _outline * flower_radial_shape);
    flower_shape *= (1. - u_moving);
    flower_shape *= (1. - step(1., u_stop_time));
    return flower_shape;
}

void main() {
    vec3 base = texture2D(u_texture, vUv).rgb;
    vec2 cursor = vUv - u_point.xy;
    cursor.x *= u_ratio;

    vec2 uv = vUv;
    uv.x *= u_ratio;
    float angle = .5 * (u_stop_randomizer[0] - .5);
    vec3 stem_color = vec3(.1 + u_stop_randomizer[0] * .6, .6, .2);
    float stem_shape = get_stem_shape(cursor, uv, .003, angle);
    stem_shape += get_stem_shape(cursor + vec2(0., .2 + .5 * u_stop_randomizer[0]), uv, .003, angle);
    float stem_mask = 1. - get_stem_shape(cursor, uv, .004, angle);
    stem_mask -= get_stem_shape(cursor + vec2(0., .2 + .5 * u_stop_randomizer[0]), uv, .004, angle);

    vec3 flower_color = vec3(.7 + u_stop_randomizer[1], .8 * u_stop_randomizer[1], 2.9 + u_stop_randomizer[0] * .6);
    vec3 flower_new = flower_color * flower_shape(cursor, 1., .96, 1., .15, 0.);
    vec3 flower_mask = 1. - vec3(flower_shape(cursor, 1.55, 1.07, 1., .15, 0.));
    vec3 flower_mid = vec3(-.6) * flower_shape(cursor, .15, 1., 2., .1, 1.9);

    vec3 color = base * flower_mask + (flower_new + flower_mid);
    color *= stem_mask;
    color += (stem_shape * stem_color);
    color *= u_clean;
    color = clamp(color, vec3(.0, .0, .15), vec3(1., 1., .4));

    gl_FragColor = vec4(color, 1.);
}
