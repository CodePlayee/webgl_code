import { initShaders } from '../lib/cuon-utils.js'

// 顶点着色器(Vertex shader)程序 (GLSL ES语言)
// 控制点的位置和大小
// 关键字attribute为存储限定符，声明的变量 a_Position 可从外部接收数据
const VSHADER_SOURCE = `
    attribute vec4 a_Position;
    attribute float a_PointSize;
    void main(){
        gl_Position=a_Position;
        gl_PointSize=a_PointSize;
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
    // 3-1 获取 attribute 变量的存储位置
    const a_Position = gl.getAttribLocation(gl.program, 'a_Position')
    if (a_Position < 0) {
        return console.log('Failed to get the storage location of a_Position.')
    }
    const a_PointSize = gl.getAttribLocation(gl.program, 'a_PointSize')
    if (a_PointSize < 0) {
        return console.log('Failed to get the storage location of a_PointSize')
    }
    const u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor')
    if (!u_FragColor) {
        return console.log('Failed to get the storage location of u_FragColor.')
    }
    console.log(a_Position, a_PointSize, u_FragColor)

    // 3-2 将顶点坐标和尺寸传给 attribute 变量
    //gl.vertexAttrib3f(a_Position, 0.0, 0.0, 0.0)
    //gl.vertexAttrib4fv(a_Position, new Float32Array([0.5, 0.5, 0.5, 1.0]))
    gl.vertexAttrib1f(a_PointSize, 10.0)

    const g_pts = []
    const g_colors = []
    canvas.onmousedown = function (e) {
        click(e, gl, canvas, a_Position, u_FragColor, g_pts, g_colors)
    }
    canvas.onmouseout = () => {
        gl.clear(gl.COLOR_BUFFER_BIT)
        g_pts.length = 0
        g_colors.length = 0
    }

    // 4 设置背景色并清空画布
    gl.clearColor(0.0, 0.0, 0.0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)

    // 5 绘图
    //gl.drawArrays(gl.POINTS, 0, 1)

}

function getWebGLContext(canvas) {
    return canvas.getContext('webgl', true)
}

function click(event, gl, canvas, a_Position, u_FragColor, g_pts, g_colors) {
    let x = event.clientX
    let y = event.clientY
    const rect = event.target.getBoundingClientRect()
    //鼠标点击位置坐标转换到 webgl canvas坐标
    x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2)
    y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2)
    g_pts.push([x, y])

    if (x >= 0.0 && y >= 0.0) {
        g_colors.push([1.0, 0.0, 0.0, 1.0])
    } else if (x < 0.0 && y < 0.0) {
        g_colors.push([0.0, 1.0, 0.0, 1.0])
    } else {
        g_colors.push([1.0, 1.0, 1.0, 1.0])
    }

    gl.clear(gl.COLOR_BUFFER_BIT) //清空

    g_pts.forEach((pt, i) => {
        gl.vertexAttrib3f(a_Position, pt[0], pt[1], 0.0)
        gl.uniform4fv(u_FragColor, g_colors[i])
        gl.drawArrays(gl.POINTS, 0, 1)
    })
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