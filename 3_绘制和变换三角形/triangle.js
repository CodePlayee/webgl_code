import { initShaders } from '../lib/cuon-utils.js'

// 顶点着色器(Vertex shader)程序 (GLSL ES语言)
// 控制点的位置和大小
// 关键字attribute为存储限定符，声明的变量 a_Position 可从外部接收数据

// 平移
// const VSHADER_SOURCE = `
//     attribute vec4 a_Position;
//     uniform vec4 u_Translation;
//     void main(){
//         //gl_Position=a_Position+u_Translation;
//     }
// `

// 旋转
const VSHADER_SOURCE = `
    attribute vec4 a_Position;
    uniform mat4 u_xformMatrix;

    void main(){
       gl_Position=u_xformMatrix * a_Position;
    }
`

// 片元着色器（Fragment shader)程序 (GLSL ES语言)
// 控制点的颜色
const FSHADER_SOURCE = `
    precision mediump float;
    uniform vec4 u_FragColor;
    void main(){
        gl_FragColor=u_FragColor;
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
    // 3-1 获取 attribute/uniform 变量的存储位置
    const a_Position = gl.getAttribLocation(gl.program, 'a_Position')
    // 平移量
    //const u_Translation = gl.getUniformLocation(gl.program, 'u_Translation')
    // 旋转参数
    const u_xformMatrix = gl.getUniformLocation(gl.program, 'u_xformMatrix');

    // 片元颜色
    const u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor')

    //const tx = 0.5, ty = 0.5, tz = 0.0
    //平移量齐次坐标与原齐次坐标相加后，第四个分量仍需为1，故平移齐次坐标的第四个分量为0
    //gl.uniform4f(u_Translation, tx, ty, tz, 0.0)

    // 传入旋转参数
    const angle = Math.PI * -0.5
    const sinB = Math.sin(angle)
    const cosB = Math.cos(angle)
    // 旋转变换矩阵(列主序)
    const xformMatrix = new Float32Array([
        cosB, sinB, 0.0, 0.0,
        -sinB, cosB, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0
    ])
    gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix)

    // 3-2 将片元颜色传递给 uniform 变量
    gl.uniform4fv(u_FragColor, [1.0, 0.0, 0.0, 1.0])

    const n = initVertexBuffers(gl, a_Position)
    if (n < 0) {
        console.log('Failed to set the positions of the vertices.')
        return
    }

    // 4 设置背景色并清空画布
    gl.clearColor(0.0, 0.0, 0.0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)

    // 5 绘图(绘制三角形)
    // POINTS LINES LINE_STRIP LINE_LOOP TRIANGLES 
    // TRIANGLE_STRIP TRIANGLE_FAN
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 3)
    gl.drawArrays(gl.LINES, 3, 4) //the axis

}

function getWebGLContext(canvas) {
    return canvas.getContext('webgl', true)
}

function initVertexBuffers(gl, a_Position) {
    const vertices = new Float32Array([
        0.0, 0.5, -0.5, -0.5, 0.5, -0.5,
        -1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, -1.0
    ])
    // const vertices = new Float32Array([
    //     -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5, -0.5
    // ])
    const n = vertices.length * 0.5

    //(1)创建缓冲区对象(对应的 deleteBuffer删除缓冲区对象)
    const vertextBuffer = gl.createBuffer()
    if (!vertextBuffer) {
        console.log('Failed to create the buffer object.')
        return -1
    }

    //(2)将缓冲区对象绑定到目标
    gl.bindBuffer(gl.ARRAY_BUFFER, vertextBuffer)

    //(3)向缓冲区对象中写入数据
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)
    //(4)将缓冲区对象(引用或指针)分配给 a_Position 变量
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0)
    //(5)连接 a_Position 变量与分配给它的缓冲区对象，使顶点着色器能够访问缓冲区内的数据
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

window.onload = main