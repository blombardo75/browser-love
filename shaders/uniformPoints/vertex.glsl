/*
attribute vec2 aVertexPosition
uniform vec3 uColor
*/

attribute vec2 aVertexPosition;
uniform vec3 uColor;
varying vec4 vColor;
void main() {
    gl_PointSize = 1.0;
    gl_Position = vec4(aVertexPosition, 0, 1);
    vColor = vec4(uColor, 1);
}