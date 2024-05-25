/*
attribute vec2 aVertexPosition
attribute vec3 aColor
*/

attribute vec2 aVertexPosition;
attribute vec3 aColor;
varying vec4 vColor;
void main() {
    gl_PointSize = 1.0;
    gl_Position = vec4(aVertexPosition, 0, 1);
    vColor = vec4(aColor, 1);
}