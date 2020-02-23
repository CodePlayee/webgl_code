import { initShaders } from '../lib/cuon-utils.js'
import { Matrix4 } from '../lib/cuon-matrix.js'

// Vertex shader program
const VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Color;\n' +
    'varying vec4 v_Color;\n' +
    'uniform mat4 u_MvpMatrix;\n' +
    'void main() {\n' +
    '  gl_Position =  u_MvpMatrix * a_Position;\n' +
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

    // Specify the color for clearing <canvas>
    gl.clearColor(0, 0, 0, 1);
    //开启隐藏面消除功能
    gl.enable(gl.DEPTH_TEST)

    // 创建 MVP 对应的Matrix4 对象
    const mvpMatrix = new Matrix4()

    mvpMatrix.setPerspective(30, canvas.width / canvas.height, 1, 100)
    mvpMatrix.lookAt(3, 3, 7, 0, 0, 0, 0, 1, 0)

    // Get the storage location of the matrix
    const u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix')

    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements)

    // 清空颜色与深度缓冲区
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // 绘制立方体
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
}

window.onload = main

function getWebGLContext(canvas) {
    return canvas.getContext('webgl', true)
}

function initVertexBuffers(gl) {
    // Create a cube
    //    v6----- v5
    //   /|      /|
    //  v1------v0|
    //  | |     | |
    //  | |v7---|-|v4
    //  |/      |/
    //  v2------v3
    const verticesColors = new Float32Array([
        // Vertex coordinates and color
        1.0, 1.0, 1.0, 1.0, 1.0, 1.0,  // v0 White
        -1.0, 1.0, 1.0, 1.0, 0.0, 1.0,  // v1 Magenta
        -1.0, -1.0, 1.0, 1.0, 0.0, 0.0,  // v2 Red
        1.0, -1.0, 1.0, 1.0, 1.0, 0.0,  // v3 Yellow
        1.0, -1.0, -1.0, 0.0, 1.0, 0.0,  // v4 Green
        1.0, 1.0, -1.0, 0.0, 1.0, 1.0,  // v5 Cyan
        -1.0, 1.0, -1.0, 0.0, 0.0, 1.0,  // v6 Blue
        -1.0, -1.0, -1.0, 0.0, 0.0, 0.0   // v7 Black
    ]);

    // Indices of the vertices
    const indices = new Uint8Array([
        0, 1, 2, 0, 2, 3,    // front
        0, 3, 4, 0, 4, 5,    // right
        0, 5, 6, 0, 6, 1,    // up
        1, 6, 7, 1, 7, 2,    // left
        7, 4, 3, 7, 3, 2,    // down
        4, 7, 6, 4, 6, 5     // back
    ]);

    // Create a buffer object
    const vertexColorbuffer = gl.createBuffer();
    const indexBuffer = gl.createBuffer();

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

    // write the indices to the buffer object
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)

    return indices.length;
}
