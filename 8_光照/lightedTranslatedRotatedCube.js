import { initShaders } from '../lib/cuon-utils.js'
import { Vector3, Matrix4 } from '../lib/cuon-matrix.js'

// <环境反射光颜色> = <入射光颜色> * <表面基底色>
// <物体表面反射光颜色> = <漫反射光颜色> + <环境反射光颜色>

// Vertex shader program
const VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Color;\n' +
    'attribute vec4 a_Normal;\n' + //法向量
    'uniform mat4 u_MvpMatrix;\n' +
    'uniform mat4 u_NormalMatrix;\n' + //模型矩阵的逆转置矩阵，用以求得变换后的法向量
    'uniform vec3 u_AmbientLightColor;\n' +
    'uniform vec3 u_DirectionalLightColor;\n' +
    'uniform vec3 u_LightDirection;\n' +
    'varying vec4 v_Color;\n' +

    'void main() {\n' +
    '  gl_Position =  u_MvpMatrix * a_Position;\n' +
    // 用法向量乘以mvp矩阵的逆转置矩阵，并对法向量进行归一化
    'vec3 normal=normalize(vec3(u_NormalMatrix * a_Normal));\n' +
    // 计算光线方向与法向量的点积(夹角余弦值)
    'float nDotL=max(dot(u_LightDirection,normal),0.0);\n' +
    // 计算漫反射光的颜色
    'vec3 diffuse=u_DirectionalLightColor * vec3(a_Color) * nDotL;\n' +
    // 计算环境反射光的颜色
    'vec3 ambient=u_AmbientLightColor * vec3(a_Color);\n' +
    //物体表面反射光的颜色
    '  v_Color = vec4(diffuse+ambient,a_Color.a);\n' +
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

    // Get the storage location of the Matrix
    const u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix')
    const u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix')

    // 模型矩阵
    const modelMatrix = new Matrix4()
    // 创建 MVP 对应的Matrix4 对象
    const mvpMatrix = new Matrix4()
    // mvp矩阵的逆转置矩阵，用以求得变换后的法向量
    const normalMatrix = new Matrix4()

    // model
    modelMatrix.setTranslate(0, 1, 0).rotate(45, 0, 0, 1)

    // mvp
    mvpMatrix.setPerspective(30, canvas.width / canvas.height, 1, 100)
    mvpMatrix.lookAt(-7, 2.5, 6, 0, 0, 0, 0, 1, 0)
    mvpMatrix.multiply(modelMatrix)

    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements)

    // 根据模型矩阵计算用来变换法向量的矩阵
    normalMatrix.setInverseOf(modelMatrix) //求逆矩阵
    normalMatrix.transpose() // 转置
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements)

    // 环境光(较弱的白光)
    const u_AmbientLightColor = gl.getUniformLocation(gl.program, 'u_AmbientLightColor')
    gl.uniform3f(u_AmbientLightColor, 0.2, 0.2, 0.2)

    // get the storage location of the lightColor and assign value
    const u_DirectionalLightColor = gl.getUniformLocation(gl.program, 'u_DirectionalLightColor')
    gl.uniform3f(u_DirectionalLightColor, 1, 1, 1)

    // get the storage location of the lightDirection and assign value
    const lightDirection = new Vector3([0.5, 3.0, 4.0]).normalize()
    const u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection')
    gl.uniform3fv(u_LightDirection, lightDirection.elements)

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

    // vertex coordinates
    const vertices = new Float32Array([
        1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0,  // v0-v1-v2-v3 front
        1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0,  // v0-v3-v4-v5 right
        1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0,  // v0-v5-v6-v1 up
        -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0,  // v1-v6-v7-v2 left
        -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,  // v7-v4-v3-v2 down
        1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0   // v4-v7-v6-v5 back
    ]);

    // Colors
    const colors = new Float32Array([
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,     // v0-v1-v2-v3 front
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,     // v0-v3-v4-v5 right
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,     // v0-v5-v6-v1 up
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,     // v1-v6-v7-v2 left
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,     // v7-v4-v3-v2 down
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0　    // v4-v7-v6-v5 back
    ]);

    // 法向量
    const normals = new Float32Array([
        0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
        1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
        0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
        -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
        0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,  // v7-v4-v3-v2 down
        0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0   // v4-v7-v6-v5 back
    ])

    // Indices of the vertices
    const indices = new Uint8Array([
        0, 1, 2, 0, 2, 3,    // front
        4, 5, 6, 4, 6, 7,    // right
        8, 9, 10, 8, 10, 11,    // up
        12, 13, 14, 12, 14, 15,    // left
        16, 17, 18, 16, 18, 19,    // down
        20, 21, 22, 20, 22, 23     // back
    ]);

    // Create a buffer object
    const indexBuffer = gl.createBuffer();

    // Write the vertex coordinates and color to the buffer object
    if (!initArrayBuffer(gl, vertices, 3, gl.FLOAT, 'a_Position')) {
        return -1;
    }
    if (!initArrayBuffer(gl, colors, 3, gl.FLOAT, 'a_Color')) {
        return -1
    }

    if (!initArrayBuffer(gl, normals, 3, gl.FLOAT, 'a_Normal')) {
        return -1
    }

    // write the indices to the buffer object
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)

    return indices.length;
}

function initArrayBuffer(gl, data, num, type, attribute) {
    // Create a buffer object
    const buffer = gl.createBuffer()
    if (!buffer) {
        console.log('Failed to create the buffer object.')
        return false
    }
    // Write data into the buffer object.
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    // Assign the buffer object to the attribute variable and enable the assignment
    const a_attribute = gl.getAttribLocation(gl.program, attribute);
    if (a_attribute < 0) {
        console.log(`Failed to get the storage location of ${attribute}.`);
        return false;
    }
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute);

    return true
}