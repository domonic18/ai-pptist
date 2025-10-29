<p align="center">
    <img src='/public/logo.png' />
</p>

<p align="center">
    <a href="https://www.github.com/pipipi-pikachu/PPTist/stargazers" target="_black"><img src="https://img.shields.io/github/stars/pipipi-pikachu/PPTist?logo=github" alt="stars" /></a>
    <a href="https://www.github.com/pipipi-pikachu/PPTist/network/members" target="_black"><img src="https://img.shields.io/github/forks/pipipi-pikachu/PPTist?logo=github" alt="forks" /></a>
    <a href="https://www.github.com/pipipi-pikachu/PPTist/blob/master/LICENSE" target="_black"><img src="https://img.shields.io/github/license/pipipi-pikachu/PPTist?color=%232DCE89&logo=github" alt="license" /></a>
    <a href="https://www.typescriptlang.org" target="_black"><img src="https://img.shields.io/badge/language-TypeScript-blue.svg" alt="language"></a>
    <a href="https://github.com/pipipi-pikachu/PPTist/issues" target="_black"><img src="https://img.shields.io/github/issues-closed/pipipi-pikachu/PPTist.svg" alt="issue"></a>
    <a href="https://gitee.com/pptist/PPTist" target="_black"><img src="https://gitee.com/pptist/PPTist/badge/star.svg?version=latest" alt="gitee"></a>
</p>

简体中文 | [English](README.md)


# 🎨 PPTist
> PowerPoint-ist（/'pauəpɔintist/），一个基于 Web 的在线演示文稿（幻灯片）应用，还原了大部分 Office PowerPoint 常用功能，支持 文字、图片、形状、线条、图表、表格、视频、音频、公式 几种最常用的元素类型，可以在 Web 浏览器中编辑/演示幻灯片。

<b>在线体验地址👉：[https://pipipi-pikachu.github.io/PPTist/](https://pipipi-pikachu.github.io/PPTist/)</b>

# ✨ 项目特色
1. 易开发：基于 Vue3.x + TypeScript 构建，不依赖UI组件库，尽量避免第三方组件，样式定制更轻松、功能扩展更方便。
2. 易使用：随处可用的右键菜单、几十种快捷键、无数次编辑细节打磨，力求还原桌面应用级体验。
3. 功能丰富：支持 PPT 中的大部分常用元素和功能，支持AI生成PPT、支持多种格式导出、支持移动端基础编辑和预览...


# 👀 前排提示
1. 本项目是一个 “Web 幻灯片应用” ，而不是 “低代码平台”、“H5 编辑器”、“图片编辑器” 、“白板应用”等。
2. 本项目的目标受众是<b>有Web幻灯片开发需求的开发者，需要有基础的web开发经验</b>，提供的链接只是一个演示地址，不提供任何在线服务。你不应该直接将本项目作为工具使用，也不支持开箱即用。如果你只是需要一个服务或工具，可以选择更优秀和成熟的产品，例如：[Slidev](https://sli.dev/)、[revealjs](https://revealjs.com/) 等。
3. 这里总结了一些[常见问题](/doc/Q&A.md)，第一次提 Issues 和 PR 时，务必提前阅读此文档。
4. 商用相关请参阅[商业用途](#-商业用途)


# 🚀 项目运行
```
npm install

npm run dev
```
浏览器访问：http://127.0.0.1:5173/


# 📚 功能列表
### 基础功能
- 历史记录（撤销、重做）
- 快捷键
- 右键菜单
- 导出本地文件（PPTX、JSON、图片、PDF）
- 导入导出特有 .pptist 文件
- 打印
- AI生成PPT
### 幻灯片页面编辑
- 页面添加、删除
- 页面顺序调整
- 页面复制粘贴
- 幻灯片分节
- 背景设置（纯色、渐变、图片）
- 设置画布尺寸
- 网格线
- 标尺
- 画布缩放、移动
- 主题设置
- 提取已有幻灯片风格
- 演讲者备注（富文本）
- 幻灯片模板
- 翻页动画
- 元素动画（入场、退场、强调）
- 选择面板（隐藏元素、层级排序、元素命名）
- 页面和节点类型标注（可用于模板相关功能）
- 查找/替换
- 批注
### 幻灯片元素编辑
- 元素添加、删除
- 元素复制粘贴
- 元素拖拽移动
- 元素旋转
- 元素缩放
- 元素多选（框选、点选）
- 多元素组合
- 多元素批量编辑
- 元素锁定
- 元素吸附对齐（移动和缩放）
- 元素层级调整
- 元素对齐到画布
- 元素对齐到其他元素
- 多元素均匀分布
- 拖拽添加图文
- 粘贴外部图片
- 元素坐标、尺寸和旋转角度设置
- 元素超链接（链接到网页、链接到其他幻灯片页面）
#### 文字
- 富文本编辑（颜色、高亮、字体、字号、加粗、斜体、下划线、删除线、角标、行内代码、引用、超链接、对齐方式、序号、项目符号、段落缩进、清除格式）
- 行高
- 字间距
- 段间距
- 首行缩进
- 填充色
- 边框
- 阴影
- 透明度
- 竖向文本
- AI改写/扩写/缩写
#### 图片
- 裁剪（自定义、按形状、按纵横比）
- 圆角
- 滤镜
- 着色（蒙版）
- 翻转
- 边框
- 阴影
- 替换图片
- 重置图片
- 设置为背景图
#### 形状
- 绘制任意多边形
- 绘制任意线条（未封闭形状模拟）
- 替换形状
- 填充（纯色、渐变、图片）
- 边框
- 阴影
- 透明度
- 翻转
- 形状格式刷
- 编辑文字（支持富文本，与文字元素的富文本编辑功能近似）
#### 线条
- 直线、基础折线/曲线
- 颜色
- 宽度
- 样式（实线、虚线、点线）
- 端点样式
#### 图表（柱状图、条形图、折线图、面积图、散点图、饼图、环形图、雷达图）
- 图表类型转换
- 数据编辑
- 背景填充
- 主题色
- 坐标轴/坐标文字颜色
- 网格颜色
- 堆积模式、平滑曲线等
#### 表格
- 行、列添加删除
- 主题设置（主题色、表头、汇总行、第一列、最后一列）
- 合并单元格
- 单元格样式（填充色、文字颜色、加粗、斜体、下划线、删除线、对齐方式）
- 边框
#### 视频
- 预览封面设置
- 自动播放
#### 音频
- 图标颜色
- 自动播放
- 循环播放
#### 公式
- LaTeX编辑
- 颜色设置
- 公式线条粗细设置
### 幻灯片放映
- 画笔工具（画笔/形状/箭头/荧光笔标注、橡皮擦除、黑板模式）
- 全部幻灯片预览
- 触底显示缩略图导航
- 计时器工具
- 激光笔
- 自动放映
- 演讲者视图
### 移动端
- 基础编辑
    - 页面添加、删除、复制、备注、撤销重做
    - 插入文字、图片、矩形、圆形
    - 元素通用操作：移动、缩放、旋转、复制、删除、层级调整、对齐
    - 元素样式：文字（加粗、斜体、下划线、删除线、字号、颜色、对齐方向）、填充色
- 基础预览
- 播放预览


# 🎯 开发
目前没有完整的开发文档，但下面这些文档可能会对你有一些帮助：
- [项目目录与数据结构](/doc/DirectoryAndData.md)
- [画布与元素的基本原理](/doc/Canvas.md)
- [如何自定义一个元素](/doc/CustomElement.md)
- [关于AIPPT](/doc/AIPPT.md)

下面是一些辅助开发的工具/仓库：
- 导入PPTX文件参考：[pptxtojson](https://github.com/pipipi-pikachu/pptxtojson)
- 绘制形状：[svgPathCreator](https://github.com/pipipi-pikachu/svgPathCreator)


# 📄 版权声明/开源协议
[AGPL-3.0 License](/LICENSE) | Copyright © 2020-PRESENT [pipipi-pikachu](https://github.com/pipipi-pikachu)


## 声明
Github、Gitee等代码托管平台存在一些仓库基于本项目代码进行了二次开发，但未遵守AGPL-3.0协议，擅自删除了AGPL-3.0协议许可证声明或改用其他协议，作者在此声明：**这些仓库的代码在事实上仍然属于AGPL-3.0协议，切勿受其误导。**