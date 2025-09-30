---
title: 'S905L3B TVBox 刷 Armbian 踩坑记录'
description: 'S905L3B TVBox 刷 Armbian 踩坑记录'
pubDate: '2025-09-30 23:29:03'
heroImage: '/blog-placeholder-1.jpg'
---

```markdown
# E900V21E 刷写 Armbian 踩坑记录

本文档记录了在 `E900V21E` 电视盒子上刷写 `Armbian` 系统过程中遇到的关键问题与解决方案。核心问题大多围绕 `u-boot`、设备树 (`dtb`) 与安卓底包的匹配。

## 1. 固件兼容性：DDR 错误与卡启动

- **现象**：启动时卡在 `DDR` 初始化阶段，无限重启或报错 `[0x1010504] Romcode/初始化DDR/读取初始化结果/USB控制命令出错`。
- **原因**：刷入的 `u-boot` 或安卓底包与盒子的主控芯片、内存型号不匹配。
- **解决**：寻找并更换为与 `S905L2/L3` 芯片及内存兼容的安卓底包和 `u-boot`。

## 2. 刷机工具与电脑平台的兼容性

- **现象**：使用 USB Burning Tool 刷写安卓底包时失败，无法识别设备或刷写过程中断。
- **原因**：刷机工具与 AMD 平台电脑存在兼容性问题。
- **解决**：**换用 Intel 平台的电脑进行刷机操作**，成功率会显著提高。

## 3. 芯片型号与 HDMI 输出

- **现象**：系统刷入后 HDMI 无信号。
- **分析**：
  - **S905L2**：HDMI 功能通常正常。
  - **S905L3**：部分版本或固件存在 HDMI 驱动兼容性问题，可能导致无输出。
- **解决**：若为 S905L3 芯片，需寻找明确支持其 HDMI 输出的 Armbian 版本或 `dtb` 文件。

## 4. 引导配置：extlinux.conf 与 uEnv.txt

- **现象**：U-Boot 阶段后无法加载 Armbian 内核。
- **分析**：不同设备或 Armbian 版本使用的引导配置文件不同。
  - 部分机器使用 `/boot/extlinux/extlinux.conf`。
  - 部分机器使用 `/boot/uEnv.txt`。
- **解决**：
  - 检查 `/boot` 目录下哪个文件是当前生效的配置。
  - Armbian 有时默认使用 `uEnv.txt`。如果发现存在 `/boot/extlinux/extlinux.conf.bak`，可将其**恢复**（重命名为 `extlinux.conf`）并编辑相应参数，以切换引导配置。

## 5. U-Boot 变体与启动介质

- **现象**：从 U 盘启动正常，但写入 eMMC 后无法启动。
- **分析**：
  - U-Boot 针对不同启动介质（如 `sd`, `usb`, `emmc`）编译了不同版本。
  - 系统按优先级查找 U-Boot 文件，通常 `u-boot.ext` 的优先级最高。
  - 从 U 盘能启动是因为使用了 `u-boot.ext`（可能专为 USB 编译），但 eMMC 引导器需要加载专为 eMMC 编译的 `u-boot.emmc` 文件。
- **解决**：
  - 在能正常 U 盘启动的系统里，将 `/boot` 目录下可用的 `u-boot.ext` 文件**复制一份，并重命名为 `u-boot.emmc`**。
  - 确保这两个文件一同被正确写入 eMMC，系统即可根据启动介质自动选择正确的 U-Boot。

## 6. 写入 eMMC 后的故障恢复

- **现象**：系统成功写入 eMMC 后，拔掉 U 盘无法启动，甚至插着 U 盘也卡住。
- **原因**：eMMC 中的 U-Boot 损坏或不匹配（见第5点）。
- **解决**：
  - **首选方案**：**重新插入之前能正常启动的 U 盘**。设备通常仍会优先从 USB 启动，从而进入系统，这为重新修复 eMMC 中的 U-Boot 提供了机会。
  - 若上述方法无效，可能需要通过短接或 TTL 串口重新线刷安卓底包。

## 核心经验总结

1.  **匹配至上**：`u-boot`、`dtb` 和安卓底包三者与硬件的匹配是成功的基础。
2.  **平台选择**：刷写安卓底包时，**Intel 电脑的兼容性远优于 AMD 电脑**。
3.  **U-Boot 是关键**：理解 U-Boot 的变体和优先级是解决启动问题的核心。
4.  **U 盘是救星**：一个能正常启动的 U 盘系统是修复 eMMC 问题的强大后盾。
5.  **灵活配置**：注意 `extlinux.conf` 和 `uEnv.txt` 的切换，这可能解决一些莫名的引导问题。
```

## 114514

这个文件里可以查各种型号匹配的 dtb、u-boot、启动配置文件[Link](https://github.com/ophub/amlogic-s9xxx-armbian/blob/main/build-armbian/armbian-files/common-files/etc/model_database.conf)

记了一下踩坑记录随便喂给 AI 生成的文章，懒得看了
