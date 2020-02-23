import { initShaders } from '../lib/cuon-utils.js'

// 本例子在矩形表面贴图像，用于说明纹理映射的原理

// 顶点着色器(Vertex shader)程序 (GLSL ES语言)
// 在顶点着色器中为每个顶点指定纹理坐标
const VSHADER_SOURCE = `
    attribute vec4 a_Position; 
    attribute vec2 a_TexCoord;
    varying vec2 v_TexCoord;
    void main(){
        gl_Position=a_Position;
        v_TexCoord=a_TexCoord;     
    }       
`

// 片元着色器（Fragment shader)程序 (GLSL ES语言)
// 根据每个片元（像素）的纹理坐标从纹理图像中抽取纹素颜色
const FSHADER_SOURCE = `
    precision mediump float;
    uniform sampler2D u_Sampler0;
    uniform sampler2D u_Sampler1;
    varying vec2 v_TexCoord;
    void main(){
        vec4 color0=texture2D(u_Sampler0,v_TexCoord);
        vec4 color1=texture2D(u_Sampler1,v_TexCoord);
        gl_FragColor=color0 * color1;
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
    const a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord')

    const n = initVertexBuffers(gl, a_Position, a_TexCoord)
    if (n < 0) {
        console.log('Failed to set the positions of the verticesTexCoords.')
        return
    }

    // 配置纹理
    if (!initTextures(gl, n)) {
        console.log('failed to init texture!')
    }

    // 4 设置背景色并清空画布
    gl.clearColor(0.0, 0.0, 0.0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)

    // 5 绘图(绘制多个点)
    //gl.drawArrays(gl.TRIANGLES, 0, n)

}

function getWebGLContext(canvas) {
    return canvas.getContext('webgl', true)
}

function initVertexBuffers(gl, a_Position, a_TexCoord) {
    //顶点坐标，纹理坐标
    const verticesTexCoords = new Float32Array([
        -0.5, 0.5, 0.0, 1.0,
        -0.5, -0.5, 0.0, 0.0,
        0.5, 0.5, 1.0, 1.0,
        0.5, -0.5, 1.0, 0.0
    ])
    const n = Math.round(verticesTexCoords.length / 4) //顶点数目

    //创建缓冲区对象(对应的 deleteBuffer删除缓冲区对象)
    const vertextTexCoordBuffer = gl.createBuffer()
    if (!vertextTexCoordBuffer) {
        console.log('Failed to create the buffer object.')
        return -1
    }

    //将顶点坐标和纹理坐标写入缓冲区对象并开启
    gl.bindBuffer(gl.ARRAY_BUFFER, vertextTexCoordBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, verticesTexCoords, gl.STATIC_DRAW)

    const FSIZE = verticesTexCoords.BYTES_PER_ELEMENT
    // 分配缓冲区并开启
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 4, 0)
    gl.enableVertexAttribArray(a_Position)

    gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, FSIZE * 4, FSIZE * 2)
    gl.enableVertexAttribArray(a_TexCoord)

    return n
}

//配置和加载纹理
function initTextures(gl, n) {
    // 创建纹理对象
    const texture0 = gl.createTexture()
    const texture1 = gl.createTexture()
    // u_Sampler（取样器），用来接收纹理图像
    const u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0')
    const u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1')
    //创建一个image对象
    const img0 = new Image()
    const img1 = new Image()

    img0.onload = () => {
        loadTexture(gl, n, texture0, u_Sampler0, img0, 0)
    }

    img1.onload = () => {
        loadTexture(gl, n, texture1, u_Sampler1, img1, 1)
    }

    img0.src = '../resources/redflower.jpg'
    img1.src = '../resources/circle.gif'

    return true
}

//标记纹理单元是否已经就绪
let g_texUnit0 = false, g_texUnit1 = false

function loadTexture(gl, n, texture, u_Sampler, img, texUnit) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1) //对纹理图像进行y轴反转
    //激活纹理
    if (texUnit === 0) {
        gl.activeTexture(gl.TEXTURE0) //激活0号纹理单元
        g_texUnit0 = true
    } else {
        gl.activeTexture(gl.TEXTURE1)
        g_texUnit1 = true
    }

    gl.bindTexture(gl.TEXTURE_2D, texture) //向target绑定纹理对象
    //配置纹理参数
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRPRED_REPEAT)
    //配置纹理图像
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img)
    //将纹理传递给着色器中的取样器
    gl.uniform1i(u_Sampler, texUnit)

    if (g_texUnit0 && g_texUnit1) {
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, n)
    }
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