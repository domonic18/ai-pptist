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

[简体中文](README_zh.md) | English


# 🎨 PPTist
> PowerPoint-ist（/'pauəpɔintist/）, A web-based presentation (slideshow) application. This application replicates most of the commonly used features of Microsoft Office PowerPoint. It supports various essential element types such as text, images, shapes, lines, charts, tables, videos, audio, and formulas. You can edit and present slides directly in a web browser.

<b>Try it online👉：[https://pipipi-pikachu.github.io/PPTist/](https://pipipi-pikachu.github.io/PPTist/)</b>

# ✨ Highlights
1. <b>Easy Development</b>: Built with Vue 3.x and TypeScript, it does not rely on UI component libraries and avoids third-party components as much as possible. This makes styling customization easier and functionality extension more convenient.
2. <b>User Friendly</b>: It offers a context menu available everywhere, dozens of keyboard shortcuts, and countless editing detail optimizations, striving to replicate a desktop application-level experience.
3. <b>Feature Rich</b>: Supports most of the commonly used elements and functionalities found in PowerPoint, supports generate PPT by AI, supports exporting in various formats, and offers basic editing and previewing on mobile devices.

# 👀 Front-Row Reminder
1. This project is a "Web Slideshow Application", not a "low-code platform", "H5 editor", "image editor", "whiteboard application", or similar tools.
2. The target audience for this project is <b>developers with needs for [Web slideshow] development, basic web development experience is required</b>. The provided link is merely a demo address and does not offer any online services. You should not use this project directly as a tool, nor does it support out-of-the-box functionality. If you simply need a service or tool, you can opt for more excellent and mature products such as: [Slidev](https://sli.dev/)、[revealjs](https://revealjs.com/), etc.
3. Here are some summarized [Frequently Asked Questions](/doc/Q&A.md). When raising Issues or submitting PRs for the first time, be sure to read this document in advance.
4. For commercial use, please refer to [商业用途](#-商业用途)


# 🚀 Installation
```
npm install

npm run dev
```
Browser access: http://127.0.0.1:5173/


# 📚 Features
### Basic Features
- History (undo, redo)
- Shortcuts
- Right-click menu
- Export local files (PPTX, JSON, images, PDF)
- Import and export pptist files
- Print
- AI PPT
### Slide Page Editing
- Add/delete pages
- Copy/paste pages
- Adjust page order
- Create sections
- Background settings (solid color, gradient, image)
- Set canvas size
- Gridlines
- Rulers
- Canvas zoom and move
- Theme settings
- Extract slides style
- Speaker notes (rich text)
- Slide templates
- Transition animations
- Element animations (entrance, exit, emphasis)
- Selection panel (hide elements, layer sorting, element naming)
- Labels for Page and Node Types (usable for template-related features)
- Find/replace
- Annotations
### Slide Element Editing
- Add/delete elements
- Copy/paste elements
- Drag and move elements
- Rotate elements
- Scale elements
- Multiple element selection (marquee, point selection)
- Group multiple elements
- Batch edit multiple elements
- Lock elements
- Magnetic alignment of elements (move and scale)
- Adjust element layer
- Align elements to canvas
- Align elements to other elements
- Evenly distribute multiple elements
- Drag to add text and images
- Paste external images
- Set element coordinates, size, and rotation
- Element hyperlinks (link to webpage, link to other slide pages)
#### Text
- Rich text editing (color, highlight, font, font size, bold, italic, underline, strikethrough, subscript, inline code, quote, hyperlink, alignment, numbering, bullet points, paragraph indent, clear formatting)
- Line height
- Character spacing
- Paragraph spacing
- First line indent
- Fill color
- Border
- Shadow
- Transparency
- Vertical text
- AI Rewrite/Expand/Abbreviate
#### Images
- Crop (custom, shape, aspect ratio)
- Rounding
- Filters
- Tint (mask)
- Flip
- Border
- Shadow
- Replace image
- Reset image
- Set as background
#### Shapes
- Draw any polygon
- Draw any line (unclosed shape simulation)
- Replace shape
- Fill (solid color, gradient, image)
- Border
- Shadow
- Transparency
- Flip
- Shape format painter
- Edit text (supports rich text, similar to text element’s rich text editing)
#### Lines
- Straight lines, polylines, curves
- Color
- Width
- Style (solid, dashed, dotted)
- Endpoint style
#### Charts (bar, column, line, area, scatter, pie, donut, radar)
- Chart type conversion
- Data editing
- Background fill
- Theme color
- Coordinate system and axis text color
- Grid color
- Other chart settings
- Border
#### Tables
- Add/delete rows and columns
- Theme settings (theme color, header, total row, first column, last column)
- Merge cells
- Cell styles (fill color, text color, bold, italic, underline, strikethrough, alignment)
- Border
#### Video
- Preview cover settings
- Auto play
#### Audio
- Icon color
- Auto play
- Loop play
#### Formulas
- LaTeX editing
- Color settings
- Formula line thickness settings
### Slide Show
- Brush tools (pen/shape/arrow/highlighter annotation, eraser, blackboard mode)
- Preview all slides
- Bottom thumbnails navigation
- Timer tool
- Laser pointer
- Auto play
- Speaker view
### Mobile
- Basic editing
  - Add/delete/copy/note/undo redo pages
  - Insert text, images, rectangles, circles
  - General element operations: move, scale, rotate, copy, delete, layer adjust, align
  - Element styles: text (bold, italic, underline, strikethrough, font size, color, alignment), fill color
- Basic preview
- Play preview


# 👀 FAQ
Some common problems: [FAQ](/doc/Q&A.md)


# 🎯 Supplement
There is currently no complete development documentation, but the following documents may be of some help to you:
- [Project Directory and Data Structure](/doc/DirectoryAndData.md)
- [Fundamentals of Canvas and Elements](/doc/Canvas.md)
- [How to Customize an Element](/doc/CustomElement.md)
- [About AIPPT](/doc/AIPPT.md)

Here are some auxiliary development tools/repositories:
- Import PPTX file reference: [pptxtojson](https://github.com/pipipi-pikachu/pptxtojson)
- Draw shape: [svgPathCreator](https://github.com/pipipi-pikachu/svgPathCreator)


# 📄 License
[AGPL-3.0 License](https://github.com/pipipi-pikachu/PPTist/blob/master/LICENSE) | Copyright © 2020-PRESENT [pipipi-pikachu](https://github.com/pipipi-pikachu)

## 声明
Github、Gitee等代码托管平台存在一些仓库基于本项目代码进行了二次开发，但未遵守AGPL-3.0协议，擅自删除了AGPL-3.0协议许可证声明或改用其他协议，作者在此声明：**这些仓库的代码在事实上仍然属于AGPL-3.0协议，切勿受其误导。**