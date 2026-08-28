# 🍄 超级马里奥 Super Mario

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-313%20passing-brightgreen.svg)](#)
[![JavaScript](https://img.shields.io/badge/javascript-ES6-yellow.svg)](#)

一个完全基于纯 JavaScript 实现的超级马里奥游戏，无需构建工具，支持 PWA 和 Electron 桌面版。

## ✨ 特性

### 🎮 游戏核心
- ✅ 4 个精心设计的关卡（地面、地下、空中、城堡）
- ✅ 多种敌人类型（板栗仔、乌龟、食人花、库巴 Boss）
- ✅ 完整的道具系统（蘑菇、火焰花、**彗星能量**）
- ✅ 隐藏水管和秘密通道
- ✅ 原汁原味的像素风格

### 🔍 调试工具（新增）
- ✅ **F3 调试模式** - 可视化碰撞箱、速度矢量、网格
- ✅ 实时显示位置、速度、FPS、实体数
- ✅ 颜色分级碰撞箱（玩家绿色、敌人红色、无害黄色）

### ✨ 视觉特效（新增）
- ✅ **粒子系统** - 金币收集和踩踏敌人的星星粒子
- ✅ **进度可视化** - 标题画面彩色进度条
- ✅ **动画增强** - 标题浮动、通关脉冲、Boss 血条分级
- ✅ **智能提醒** - 时间警告（颜色+音效）、彗星倒计时闪烁

### 🎵 音频系统
- ✅ Web Audio API 实时合成音效（零外部资源）
- ✅ 3 种原创背景音乐（地面、地下、空中）
- ✅ 完整的游戏音效系统
- ✅ 时间警告音效

### 📱 跨平台支持
- ✅ 纯浏览器运行（无需服务器）
- ✅ PWA 渐进式 Web 应用（可安装、离线游玩）
- ✅ Electron 桌面版（Windows）
- ✅ 触屏优化（移动设备友好）

## 🎯 快速开始

### 方式 1：浏览器直接运行
```bash
# 克隆仓库
git clone https://github.com/chuanjianguo123456/super-mario.git
cd super-mario

# 直接打开 index.html
# Windows: 
start index.html

# Mac/Linux:
open index.html
```

### 方式 2：本地服务器（可选）
```bash
# 使用 Python
python -m http.server 8000

# 或使用 Node.js
npx http-server -p 8000

# 访问 http://localhost:8000
```

### 方式 3：桌面版（Electron）
```bash
# 安装依赖
npm install

# 启动桌面版
npm start

# 打包 Windows 安装包
npm run dist:win
```

## 🎮 操作说明

### 键盘操作
| 按键 | 功能 |
|------|------|
| ← → / A D | 左右移动 |
| ↑ / W | 向上（查看/进入水管） |
| ↓ / S | 向下（进入水管） |
| Z / 空格 / K | 跳跃 |
| X / Shift / J | 奔跑 / 发射火球 |
| P / ESC | 暂停游戏 |
| R | 重新开始当前关卡 |
| M | 静音 / 开启声音 |
| **F3** | **切换调试模式** 🆕 |
| Enter | 开始游戏 |
| C | 继续到最后通关关卡 |

### 触屏操作
游戏在移动设备上会自动显示虚拟按键。

## 🎨 游戏截图

### 调试模式（按 F3）
![Debug Mode](docs/debug-mode.png)
*可视化碰撞箱、速度矢量、实时数据*

### 粒子特效
![Particles](docs/particles.png)
*金币收集和踩踏敌人的粒子效果*

### 进度条
![Progress](docs/progress-bar.png)
*标题画面的可视化进度条*

## 🔧 技术栈

- **语言：** 纯 JavaScript（ES6）
- **图形：** Canvas 2D API
- **音频：** Web Audio API（实时合成）
- **桌面：** Electron
- **PWA：** Service Worker + Manifest
- **测试：** 自研无头测试框架（313 项测试）

## 📂 项目结构

```
super-mario/
├── index.html              # 主页面
├── app.js                  # PWA 初始化
├── sw.js                   # Service Worker
├── manifest.webmanifest    # PWA 配置
├── js/
│   ├── game.js            # 游戏主循环、物理引擎、调试模式
│   ├── entities.js        # 实体系统、粒子系统
│   ├── levels.js          # 关卡定义
│   ├── world.js           # 碰撞检测
│   ├── sprites.js         # 精灵数据
│   ├── tiles.js           # 瓦片渲染
│   ├── input.js           # 输入处理
│   ├── audio.js           # 音频系统
│   └── font.js            # 位图字体
├── assets/                # 图标资源
├── desktop/               # Electron 配置
├── _test.js              # 自动化测试
└── docs/                 # 文档

```

## ✅ 测试

项目包含 313 项自动化测试，覆盖：

```bash
# 运行测试
node _test.js
```

测试覆盖：
- ✅ 资源完整性检查
- ✅ 关卡几何验证
- ✅ 物理引擎测试
- ✅ 碰撞检测测试
- ✅ 战斗系统测试
- ✅ 道具系统测试
- ✅ 过关流程测试
- ✅ Boss 战测试
- ✅ 彗星能量系统测试
- ✅ 存档系统测试
- ✅ 渲染系统测试

## 📝 更新日志

### v1.1.0 (2026-08-29) - 增强版
- ✨ 新增 F3 调试模式，可视化碰撞箱和速度矢量
- ✨ 实现粒子系统，增强游戏打击感
- ✨ 添加进度条可视化
- 🎨 优化 HUD 显示（颜色分级、闪烁提醒）
- 🎵 增加时间警告音效
- ⚡ 优化玩家物理参数，手感更流畅
- 💪 增强 Boss 战斗（HP+1、攻击频率提升）
- 📚 完善文档和 README

### v1.0.1 (2026-08-27)
- 🎮 添加彗星能量道具
- 🏰 完善旗杆和城堡关卡
- 🎨 改进控制和应用生命周期
- 💾 添加声音偏好持久化

### v1.0.0 (2026-08-25)
- 🎉 初始发布
- 🎮 4 个完整关卡
- 📱 PWA 支持
- 🖥️ Electron 桌面版

详细改进说明请查看 [IMPROVEMENTS.md](IMPROVEMENTS.md)

## 🎯 游戏特色

### 彗星能量 ⭐
这是一个原创道具，收集后获得 8 秒的无敌时间，触碰敌人会直接消灭它们。适合新手玩家快速通过困难区域。

### 智能 AI Bot 测试 🤖
项目包含一个会"看路"的 AI Bot，用于验证每个关卡的可通过性。这确保了关卡设计的合理性。

### 性能优化 ⚡
- 稳定 60 FPS
- 轻量级粒子系统
- 高效的碰撞检测算法
- 渐进式资源加载

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

如果你有好的想法或发现了 Bug，请随时：
1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- 灵感来源：经典超级马里奥兄弟
- 调试系统设计参考：[ByteTuxiaobei/Mario](https://github.com/ByteTuxiaobei/Mario) (C++ 实现)
- 像素风格美术：自绘
- 音乐与音效：Web Audio API 实时合成

## 📮 联系方式

- GitHub: [@chuanjianguo123456](https://github.com/chuanjianguo123456)
- 项目地址: https://github.com/chuanjianguo123456/super-mario

---

⭐ 如果这个项目对你有帮助，请给它一个 Star！
