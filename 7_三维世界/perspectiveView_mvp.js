import { initShaders } from '../lib/cuon-utils.js'
import { Matrix4 } from '../lib/cuon-matrix.js'

// LookAtTriangles.js (c) 2012 matsuda
// Vertex shader program
const VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Color;\n' +
    'uniform mat4 u_ModelMatrix;\n' +
    'uniform mat4 u_ViewMatrix;\n' +
    'uniform mat4 u_ProjMatrix;\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_Position =  u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;\n' +
    '  v_Color = a_Color;\n' +
    '}\n';

// Fragment shader program
const FSHADER_SOURCE =
    '#ifdef GL_ES\n' +
    'precision mediump float;\n' +
    '#endif\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_FragColor = v_Color;\n' +
    '}\n';

function main() {
    // Retrieve <canvas> element
    const canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    const gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // Set the vertex coordinates and color (the blue triangle is in the front)
    const n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
    }

    // Get the storage location of the three matrix
    const u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix')
    const u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    const u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix')

    // 创建 MVP 对应的Matrix4 对象
    const modelMatrix = new Matrix4() //模型矩阵
    const viewMatrix = new Matrix4() //视图矩阵
    const projMatrix = new Matrix4() //投影矩阵

    modelMatrix.setTranslate(0.75, 0, 0)
    viewMatrix.setLookAt(0, 0, 5, 0, 0, -100, 0, 1, 0)
    projMatrix.setPerspective(30, canvas.width / canvas.height, 1, 100)

    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements)
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
    gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements)

    // Specify the color for clearing <canvas>
    gl.clearColor(0, 0, 0, 1);
    //开启隐藏面消除功能
    gl.enable(gl.DEPTH_TEST)
    // 清除颜色与深度缓冲区
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // 绘制右侧的一组三角形
    gl.drawArrays(gl.TRIANGLES, 0, n);

    // 为左侧的三角形重新计算模型矩阵
    modelMatrix.setTranslate(-0.75, 0, 0)
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements)
    gl.drawArrays(gl.TRIANGLES, 0, n)
}

window.onload = main

function getWebGLContext(canvas) {
    return canvas.getContext('webgl', true)
}

function initVertexBuffers(gl) {
    const verticesColors = new Float32Array([
        // Vertex coordinates and color(RGBA)
        // the 3 triangles in the right
        0.0, 1.0, 0.0, 0.4, 0.4, 1.0,  // The front blue one 
        -0.5, -1.0, 0.0, 0.4, 0.4, 1.0,
        0.5, -1.0, 0.0, 1.0, 0.4, 0.4,

        0.0, 1.0, -4, 0.4, 1.0, 0.4, // The back green one
        -0.5, -1.0, -4, 0.4, 1.0, 0.4,
        0.5, -1.0, -4, 1.0, 0.4, 0.4,

        0.0, 1.0, -2, 1.0, 0.4, 0.4, // The middle yellow one
        -0.5, -1.0, -2, 1.0, 1.0, 0.4,
        0.5, -1.0, -2, 1.0, 1.0, 0.4,
    ]);
    const n = Math.round(verticesColors.length / 6);

    // Create a buffer object
    const vertexColorbuffer = gl.createBuffer();
    if (!vertexColorbuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    // Write the vertex coordinates and color to the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

    const FSIZE = verticesColors.BYTES_PER_ELEMENT;
    // Assign the buffer object to a_Position and enable the assignment
    const a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
    gl.enableVertexAttribArray(a_Position);

    // Assign the buffer object to a_Color and enable the assignment
    const a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    if (a_Color < 0) {
        console.log('Failed to get the storage location of a_Color');
        return -1;
    }
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
    gl.enableVertexAttribArray(a_Color);

    // Unbind the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return n;
}
