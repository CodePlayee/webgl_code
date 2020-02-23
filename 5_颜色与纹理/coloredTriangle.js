import { initShaders } from '../lib/cuon-utils.js'

// 顶点着色器(Vertex shader)程序 (GLSL ES语言)
// 控制点的位置和大小
// 关键字attribute为存储限定符，声明的变量 a_Position 可从外部接收数据
// varying变量的作用是从顶点着色器向片元着色器传输数据
const VSHADER_SOURCE = `
    attribute vec4 a_Position; 
    void main(){
        gl_Position=a_Position;
        gl_PointSize=10.0;     
    }       
`

// 片元着色器（Fragment shader)程序 (GLSL ES语言)
// 根据片元（像素）的坐标指定其颜色
const FSHADER_SOURCE = `
    precision mediump float;
    uniform float u_Width;
    uniform float u_Height;
    void main(){
        gl_FragColor=vec4(gl_FragCoord.x/u_Width,0.0,gl_FragCoord.y/u_Height,1.0);
    }
`

function main() {
    // 0 获取canvas元素
    const canvas = document.getElementById('canvas')

    // 1 获取WebGL绘图上下文
    const gl = getWebGLContext(canvas)
    resize(canvas)
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // 2 初始化着色器
    // initShaders is in cuon.util.js
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        return console.log('Failed to intialize shader.')
    }

    // 3 在 js 中传递数据给顶点着色器
    // 3-1 获取 attribute 变量的存储位置
    const a_Position = gl.getAttribLocation(gl.program, 'a_Position')
    const u_Width = gl.getUniformLocation(gl.program, 'u_Width')
    const u_Height = gl.getUniformLocation(gl.program, 'u_Height')

    gl.uniform1f(u_Width, gl.drawingBufferWidth)
    gl.uniform1f(u_Height, gl.drawingBufferHeight)

    const n = initBuffers(gl, a_Position)
    if (n < 0) {
        console.log('Failed to set the positions of the verticesColors.')
        return
    }

    // 4 设置背景色并清空画布
    gl.clearColor(0.0, 0.0, 0.0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)

    // 5 绘图(绘制多个点)
    gl.drawArrays(gl.TRIANGLES, 0, n)

}

function getWebGLContext(canvas) {
    return canvas.getContext('webgl', true)
}

function initBuffers(gl, a_Position) {
    //点的坐标与颜色
    const verticesColors = new Float32Array([
        0.0, 0.5, 1.0, 0.0, 0.0,
        -0.5, -0.5, 0.0, 1.0, 0.0,
        0.5, -0.5, 0.0, 0.0, 1.0
    ])
    const n = Math.round(verticesColors.length / 5)

    //创建缓冲区对象(对应的 deleteBuffer删除缓冲区对象)
    const vertextColorBuffer = gl.createBuffer()
    if (!vertextColorBuffer) {
        console.log('Failed to create the buffer object.')
        return -1
    }

    //将顶点数据写入缓冲区对象并开启
    gl.bindBuffer(gl.ARRAY_BUFFER, vertextColorBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW)

    const FSIZE = verticesColors.BYTES_PER_ELEMENT
    // 分配缓冲区并开启
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 5, 0)
    gl.enableVertexAttribArray(a_Position)

    return n
}

function resize(canvas) {
    // Lookup the size the browser is displaying the canvas(set by css).
    var displayWidth = canvas.clientWidth;
    var displayHeight = canvas.clientHeight;

    // Check if the canvas is not the same size.
    if (canvas.width != displayWidth ||
        canvas.height != displayHeight) {

        // Make the canvas the same size
        canvas.width = displayWidth;
        canvas.height = displayHeight;
    }
}

function locationCheck(a_Position, a_PointSize, u_FragColor) {
    if (a_Position < 0) {
        return console.log('Failed to get the storage location of a_Position.')
    }
    if (a_PointSize < 0) {
        return console.log('Failed to get the storage location of a_PointSize')
    }
    if (!u_FragColor) {
        return console.log('Failed to get the storage location of u_FragColor.')
    }
}

window.onload = main